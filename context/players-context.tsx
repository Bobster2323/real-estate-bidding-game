"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export type Player = {
  id: string
  name: string
  balance: number
}

type PlayersContextType = {
  players: Player[]
  addPlayer: (name: string, startingBalance: number) => void
  removePlayer: (id: string) => void
  updatePlayerBalance: (id: string, amount: number) => void
  getPlayerById: (id: string) => Player | undefined
  startingBalance: number
  setStartingBalance: (balance: number) => void
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined)

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [startingBalance, setStartingBalance] = useState(() => {
    const saved = localStorage.getItem("realEstateStartingBalance")
    return saved ? parseInt(saved) : 1000000
  })

  // Load players from localStorage on mount
  useEffect(() => {
    const savedPlayers = localStorage.getItem("realEstatePlayers")
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers))
    }
  }, [])

  // Save players to localStorage when they change
  useEffect(() => {
    localStorage.setItem("realEstatePlayers", JSON.stringify(players))
  }, [players])

  // Save starting balance to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("realEstateStartingBalance", startingBalance.toString())
  }, [startingBalance])

  const addPlayer = (name: string, balance: number = startingBalance) => {
    const newPlayer = {
      id: Date.now().toString(),
      name,
      balance,
    }
    setPlayers((prev) => [...prev, newPlayer])
  }

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id))
  }

  const updatePlayerBalance = (id: string, amount: number) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, balance: player.balance + amount } : player
      )
    )
  }

  const getPlayerById = (id: string) => {
    return players.find((player) => player.id === id)
  }

  return (
    <PlayersContext.Provider
      value={{
        players,
        addPlayer,
        removePlayer,
        updatePlayerBalance,
        getPlayerById,
        startingBalance,
        setStartingBalance,
      }}
    >
      {children}
    </PlayersContext.Provider>
  )
}

export function usePlayers() {
  const context = useContext(PlayersContext)
  if (context === undefined) {
    throw new Error("usePlayers must be used within a PlayersProvider")
  }
  return context
} 