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
}

type ListingsContextType = {
  listings: Listing[]
  currentListingIndex: number
  showPrice: boolean
  addListing: (listing: Omit<Listing, "id">) => void
  removeListing: (id: string) => void
  nextListing: () => void
  previousListing: () => void
  revealPrice: () => void
  hidePrice: () => void
  resetGame: () => void
  currentListing: Listing | null
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
      setCurrentListingIndex((prev) => prev + 1)
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
  }

  const currentListing = listings.length > 0 ? listings[currentListingIndex] : null

  return (
    <ListingsContext.Provider
      value={{
        listings,
        currentListingIndex,
        showPrice,
        addListing,
        removeListing,
        nextListing,
        previousListing,
        revealPrice,
        hidePrice,
        resetGame,
        currentListing,
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
