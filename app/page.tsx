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

  useEffect(() => {
    router.replace("/bank/dashboard");
  }, [router]);

  const handleCreateGame = async () => {
    setLoading(true)
    const game = await createGame()
    await joinSession(game.id)
    router.push(`/host/${game.id}`)
  }

  return null;
}
