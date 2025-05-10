"use client"

import { usePlayers } from "@/context/players-context"
import { useCredit } from "@/context/credit-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { X } from "lucide-react"

export function PlayerManagement() {
  const { players, addPlayer, removePlayer, startingBalance } = usePlayers()
  const { initializeCredit, removeCredit } = useCredit()
  const [newPlayerName, setNewPlayerName] = useState("")

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlayerName.trim()) {
      const playerId = Date.now().toString() // Generate ID here to use for both player and credit
      addPlayer(newPlayerName.trim(), startingBalance)
      initializeCredit(playerId) // Initialize credit score for new player
      setNewPlayerName("")
    }
  }

  const handleRemovePlayer = (id: string) => {
    removePlayer(id)
    removeCredit(id) // Clean up credit score when player is removed
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Players</h2>
      
      {/* Add Player Form */}
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

      {/* Players List */}
      <div className="space-y-4">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between bg-muted p-4 rounded-lg"
          >
            <div>
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-muted-foreground">
                Balance: €{Math.floor(player.balance).toLocaleString()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemovePlayer(player.id)}
              className="text-destructive hover:text-destructive"
            >
              <X size={20} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 