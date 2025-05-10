"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="flex items-center gap-2 mb-8">
        <Home size={32} />
        <h1 className="text-4xl font-bold">Real Estate Bidding Game</h1>
      </div>
      <p className="text-xl mb-12 max-w-2xl text-muted-foreground">
        A local multiplayer game where players bid on real estate properties and try to make the best deals.
      </p>
      <div className="flex gap-4">
        <Link href="/setup">
          <Button size="lg" className="text-xl py-6 px-8">
            Start New Game
          </Button>
        </Link>
        <Link href="/add">
          <Button size="lg" variant="outline" className="text-xl py-6 px-8">
            Add Listings
          </Button>
        </Link>
      </div>
    </div>
  )
}
