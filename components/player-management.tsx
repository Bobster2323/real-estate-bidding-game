"use client"

import { usePlayers } from "@/context/players-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { X } from "lucide-react"

export function PlayerManagement() {
  const { players, addPlayer, removePlayer } = usePlayers()
  const [newPlayerName, setNewPlayerName] = useState("")

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim())
      setNewPlayerName("")
    }
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
                Balance: €{player.balance.toLocaleString()}
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
  )
} 