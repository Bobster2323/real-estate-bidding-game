"use client"

import { useListings } from "@/context/listings-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Home, ImageIcon } from "lucide-react"
import Image from "next/image"
import { Leaderboard } from "@/components/leaderboard"
import { BiddingControls } from "@/components/bidding-controls"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function GamePage() {
  const { currentListing, showPrice, nextListing, previousListing, currentListingIndex, listings } = useListings()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!currentListing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h1 className="text-4xl font-bold mb-8">No Listings Available</h1>
        <p className="text-xl mb-8">Add some listings to start the game.</p>
        <div className="flex gap-4">
          <Link href="/add">
            <Button size="lg" className="text-xl py-6 px-8">
              Add Listings
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline" className="text-xl py-6 px-8">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    if (currentListing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % currentListing.images.length)
    }
  }

  const prevImage = () => {
    if (currentListing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + currentListing.images.length) % currentListing.images.length)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-6 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg">
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Property
            </span>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={previousListing}
                disabled={currentListingIndex <= 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">
                {currentListingIndex + 1}/{listings.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextListing}
                disabled={currentListingIndex >= listings.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-6 py-4 grid grid-cols-12 gap-6 h-[calc(100vh-3.5rem)]">
        {/* Left Column - Leaderboard */}
        <div className="col-span-3 min-w-[300px] overflow-auto">
          <Leaderboard />
        </div>

        {/* Middle Column - Property Details */}
        <div className="col-span-6 min-w-[500px] overflow-auto">
          <div className="space-y-4">
            {/* Property Title */}
            <div>
              <h1 className="text-2xl font-bold">{currentListing.title}</h1>
              <p className="text-muted-foreground">
                {currentListing.area} · {currentListing.size} · {currentListing.rooms}
              </p>
            </div>

            {/* Main Image */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border bg-muted">
              {currentListing.images.length > 0 ? (
                <>
                  <Image
                    src={currentListing.images[currentImageIndex] || "/placeholder.svg"}
                    alt={currentListing.title}
                    fill
                    className="object-cover"
                  />
                  {currentListing.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-90"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-90"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {currentListing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {currentListing.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-16 w-24 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Property Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Area</div>
                <div className="text-lg font-medium">{currentListing.area}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Size</div>
                <div className="text-lg font-medium">{currentListing.size}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Rooms</div>
                <div className="text-lg font-medium">{currentListing.rooms}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Bidding Controls */}
        <div className="col-span-3 min-w-[300px] overflow-auto">
          <BiddingControls />
        </div>
      </main>
    </div>
  )
}

