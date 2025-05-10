"use client"

import { usePlayers } from "@/context/players-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const { players, addPlayer, removePlayer } = usePlayers()
  const [newPlayerName, setNewPlayerName] = useState("")
  const [startingBalance, setStartingBalance] = useState(1000000)
  const { startingBalance: contextStartingBalance, setStartingBalance: setContextStartingBalance } = usePlayers()
  const router = useRouter()

  useEffect(() => {
    setStartingBalance(contextStartingBalance)
  }, [contextStartingBalance])

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim(), startingBalance)
      setNewPlayerName("")
    }
  }

  const handleStartGame = () => {
    if (players.length > 0) {
      setContextStartingBalance(startingBalance)
      router.push("/game")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Player Setup</h1>
          <p className="text-xl text-muted-foreground">
            Add players to start the game. Each player starts with €{startingBalance.toLocaleString()}.
          </p>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm mb-8">
          <div className="mb-6">
            <label htmlFor="startingBalance" className="block text-sm font-medium mb-2">
              Starting Balance (€)
            </label>
            <div className="flex gap-2 items-center">
              <Input
                id="startingBalance"
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(Number(e.target.value))}
                className="flex-grow"
              />
            </div>
          </div>

          <form onSubmit={handleAddPlayer} className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="Enter player name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit">Add Player</Button>
          </form>

          <div className="space-y-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-muted p-4 rounded-lg"
              >
                <div>
                  <div className="font-medium text-lg">{player.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Starting Balance: €{player.balance.toLocaleString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlayer(player.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X size={20} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="text-xl py-6 px-12"
            onClick={handleStartGame}
            disabled={players.length === 0}
          >
            Start Game
          </Button>
        </div>
      </div>
    </div>
  )
} 