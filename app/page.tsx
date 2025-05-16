"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home } from "lucide-react"
import { useGameSession } from "@/context/game-session-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createGame } from "@/lib/supabaseGame"
import { supabase } from "@/lib/supabaseClient"
import { SignOutButton } from "@/components/SignOutButton"

export default function HomePage() {
  const { joinSession } = useGameSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/auth")
      }
    })
  }, [router])

  const handleCreateGame = async () => {
    setLoading(true)
    const game = await createGame()
    await joinSession(game.id)
    router.push(`/host/${game.id}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center relative">
      <div className="absolute top-6 right-6">
        <SignOutButton />
      </div>
      <div className="flex items-center gap-2 mb-8">
        <Home size={32} />
        <h1 className="text-4xl font-bold">Real Estate Bidding Game</h1>
      </div>
      <p className="text-xl mb-12 max-w-2xl text-muted-foreground">
        A local multiplayer game where players bid on real estate properties and try to make the best deals.
      </p>
      <div className="flex gap-4">
        <Button
          size="lg"
          className="text-xl py-6 px-8"
          onClick={handleCreateGame}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Game"}
        </Button>
        <Link href="/add">
          <Button size="lg" variant="outline" className="text-xl py-6 px-8">
            Add Listings
          </Button>
        </Link>
      </div>
    </div>
  )
}
