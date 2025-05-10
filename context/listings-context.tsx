"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

export type Listing = {
  id: string
  title: string
  images: string[] // Can contain multiple images, no limit
  area: string
  size: string
  rooms: string
  realPrice: number
  agentId: string // ID of the player who added this listing
  bidResult?: {
    playerName: string
    bidAmount: number
    loanAmount: number
    interestRate: number
    realPrice: number
    profit: number
  }
}

type ListingsContextType = {
  listings: Listing[]
  currentListing: Listing | null
  currentListingIndex: number
  showPrice: boolean
  setShowPrice: (show: boolean) => void
  addListing: (listing: Omit<Listing, "id">) => void
  removeListing: (id: string) => void
  nextListing: () => void
  previousListing: () => void
  revealPrice: () => void
  hidePrice: () => void
  resetGame: () => void
  canPlayerBid: (playerId: string) => boolean
  setBidResult: (result: Listing['bidResult']) => void
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined)

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([])
  const [currentListingIndex, setCurrentListingIndex] = useState(0)
  const [showPrice, setShowPrice] = useState(false)

  // Load listings from localStorage on mount
  useEffect(() => {
    const savedListings = localStorage.getItem("realEstateListings")
    if (savedListings) {
      setListings(JSON.parse(savedListings))
    }
  }, [])

  // Save listings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("realEstateListings", JSON.stringify(listings))
  }, [listings])

  const addListing = (listing: Omit<Listing, "id">) => {
    const newListing = {
      ...listing,
      id: Date.now().toString(),
    }
    setListings((prev) => [...prev, newListing])
  }

  const removeListing = (id: string) => {
    setListings((prev) => prev.filter((listing) => listing.id !== id))
  }

  const nextListing = () => {
    if (currentListingIndex < listings.length - 1) {
      setCurrentListingIndex(currentListingIndex + 1)
      setShowPrice(false)
    }
  }

  const previousListing = () => {
    if (currentListingIndex > 0) {
      setCurrentListingIndex((prev) => prev - 1)
      setShowPrice(false)
    }
  }

  const revealPrice = () => {
    setShowPrice(true)
  }

  const hidePrice = () => {
    setShowPrice(false)
  }

  const resetGame = () => {
    setCurrentListingIndex(0)
    setShowPrice(false)
    // Clear all bid results
    setListings(prev => prev.map(listing => ({
      ...listing,
      bidResult: undefined
    })))
  }

  const currentListing = listings.length > 0 ? listings[currentListingIndex] : null

  const canPlayerBid = (playerId: string) => {
    if (!currentListing) return false
    return currentListing.agentId !== playerId
  }

  const setBidResult = (result: Listing['bidResult']) => {
    setListings(prev => prev.map((listing, index) => {
      if (index === currentListingIndex) {
        return { ...listing, bidResult: result }
      }
      return listing
    }))
  }

  return (
    <ListingsContext.Provider
      value={{
        listings,
        currentListing: listings[currentListingIndex] || null,
        currentListingIndex,
        showPrice,
        setShowPrice,
        addListing,
        removeListing,
        nextListing,
        previousListing,
        revealPrice,
        hidePrice,
        resetGame,
        canPlayerBid,
        setBidResult,
      }}
    >
      {children}
    </ListingsContext.Provider>
  )
}

export function useListings() {
  const context = useContext(ListingsContext)
  if (context === undefined) {
    throw new Error("useListings must be used within a ListingsProvider")
  }
  return context
}
