"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export type GameSession = {
  id: string
  hostId: string
  players: string[] // Array of player IDs
  createdAt: number
  status: "waiting" | "in_progress" | "completed"
}

type GameSessionContextType = {
  currentSession: GameSession | null
  createSession: () => string
  joinSession: (sessionId: string) => Promise<boolean>
  leaveSession: () => void
  getSessionUrl: () => string
}

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined)

export function GameSessionProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null)
  const router = useRouter()

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("realEstateGameSession")
    if (savedSession) {
      setCurrentSession(JSON.parse(savedSession))
    }
  }, [])

  // Save session to localStorage when it changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem("realEstateGameSession", JSON.stringify(currentSession))
    } else {
      localStorage.removeItem("realEstateGameSession")
    }
  }, [currentSession])

  const createSession = () => {
    const sessionId = Math.random().toString(36).substring(2, 8)
    const newSession: GameSession = {
      id: sessionId,
      hostId: Date.now().toString(), // Temporary host ID
      players: [],
      createdAt: Date.now(),
      status: "waiting"
    }
    setCurrentSession(newSession)
    return sessionId
  }

  const joinSession = async (sessionId: string) => {
    // In a real app, this would validate the session with a backend
    // For now, we'll just create a new session with the provided ID
    const newSession: GameSession = {
      id: sessionId,
      hostId: "unknown", // Will be set by the host
      players: [],
      createdAt: Date.now(),
      status: "waiting"
    }
    setCurrentSession(newSession)
    return true
  }

  const leaveSession = () => {
    setCurrentSession(null)
  }

  const getSessionUrl = () => {
    if (!currentSession) return ""
    return `${window.location.origin}/join/${currentSession.id}`
  }

  return (
    <GameSessionContext.Provider
      value={{
        currentSession,
        createSession,
        joinSession,
        leaveSession,
        getSessionUrl
      }}
    >
      {children}
    </GameSessionContext.Provider>
  )
}

export function useGameSession() {
  const context = useContext(GameSessionContext)
  if (context === undefined) {
    throw new Error("useGameSession must be used within a GameSessionProvider")
  }
  return context
} 