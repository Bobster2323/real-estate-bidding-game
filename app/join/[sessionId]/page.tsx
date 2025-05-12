"use client"

import { use, useState } from "react"
import { useGameSession } from "@/context/game-session-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { joinGame } from "@/lib/supabaseGame"

export default function JoinGamePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const [playerName, setPlayerName] = useState("")
  const [error, setError] = useState("")
  const { joinSession } = useGameSession()
  const router = useRouter()

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }

    try {
      // Join the game in Supabase
      const player = await joinGame(sessionId, playerName)
      // Store playerId in localStorage for later use
      localStorage.setItem("supabasePlayerId", player.id)
      // Optionally update session context
      await joinSession(sessionId)
      router.push(`/lobby/${sessionId}?player=1`)
    } catch (err) {
      setError("An error occurred while joining the game")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Join Game</h1>
          <p className="text-muted-foreground">
            Enter your name to join the game session
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <Button
            onClick={handleJoin}
            className="w-full"
          >
            Join Game
          </Button>

          <div className="text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 