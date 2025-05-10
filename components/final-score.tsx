import { useEffect, useRef } from "react"
import { usePlayers } from "@/context/players-context"
import { useListings } from "@/context/listings-context"
import { Trophy, Crown, ArrowRight, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import Image from "next/image"

interface ExtendedAudioElement extends HTMLAudioElement {
  fadeOut: () => Promise<void>;
  fadeIn: () => Promise<void>;
  enableMusic: () => void;
}

export function FinalScore() {
  const { players, startingBalance } = usePlayers()
  const { listings } = useListings()
  const victorySoundRef = useRef<HTMLAudioElement | null>(null)
  const backgroundMusicRef = useRef<ExtendedAudioElement | null>(null)

  // Sort players by balance in descending order
  const sortedPlayers = [...players].sort((a, b) => b.balance - a.balance)
  const winner = sortedPlayers[0]
  const winningProfit = winner.balance - startingBalance
  const winningPercentage = ((winningProfit / startingBalance) * 100).toFixed(1)

  // Calculate investments for each player
  const playerInvestments: Record<string, { count: number; properties: typeof listings }> = {}
  players.forEach(player => {
    const investedListings = listings.filter(l => l.bidResult && l.bidResult.playerName === player.name)
    playerInvestments[player.id] = {
      count: investedListings.length,
      properties: investedListings,
    }
  })

  useEffect(() => {
    // Initialize victory sound
    victorySoundRef.current = new Audio("/victory.mp3")
    
    // Get background music element and play victory sound
    const playVictoryEffects = async () => {
      // First fade out background music
      const bgMusic = document.querySelector<ExtendedAudioElement>('audio')
      if (bgMusic) {
        backgroundMusicRef.current = bgMusic
        await bgMusic.fadeOut()
        
        // Add a small delay before playing victory sound
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Then play victory sound
      if (victorySoundRef.current) {
        try {
          victorySoundRef.current.volume = 1
          await victorySoundRef.current.play().catch(() => {
            // If play fails, try one more time after a short delay
            return new Promise(resolve => {
              setTimeout(async () => {
                try {
                  await victorySoundRef.current?.play()
                  resolve(undefined)
                } catch (error) {
                  console.error("Error playing victory sound on retry:", error)
                  resolve(undefined)
                }
              }, 100)
            })
          })
        } catch (error) {
          console.error("Error playing victory sound:", error)
        }
      }
      
      // Fire confetti
      const count = 200
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#FFD700', '#FFA500', '#FF8C00']
      }

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        })
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })

      fire(0.2, {
        spread: 60,
      })

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })
    }

    playVictoryEffects()

    return () => {
      if (victorySoundRef.current) {
        victorySoundRef.current.pause()
        victorySoundRef.current.src = ""
      }
      // Restore background music volume when component unmounts
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.fadeIn()
      }
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <div className="max-w-3xl w-full bg-card rounded-xl border shadow-xl overflow-hidden">
        <div className="p-8 text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="w-20 h-20 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center"
          >
            <Crown className="w-12 h-12 text-yellow-500" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h1 className="text-4xl font-bold mt-4">Game Over!</h1>
            <p className="text-xl text-muted-foreground mt-2">
              {winner.name} wins with a {winningPercentage}% profit!
            </p>
          </motion.div>
          {/* Winner's property gallery */}
          {playerInvestments[winner.id].count > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">{winner.name}'s Investments</h3>
              <div className="flex gap-2 overflow-x-auto justify-center">
                {playerInvestments[winner.id].properties.map((listing) => (
                  <div key={listing.id} className="w-28 h-20 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                    {listing.images && listing.images.length > 0 ? (
                      <Image src={listing.images[0]} alt={listing.title} width={112} height={80} className="object-cover w-full h-full" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t">
          <div className="p-6 space-y-4">
            {sortedPlayers.map((player, index) => {
              const profit = player.balance - startingBalance
              const profitPercentage = ((profit / startingBalance) * 100).toFixed(1)
              const investments = playerInvestments[player.id].count
              
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.2 }}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    index === 0 ? "bg-yellow-500 text-yellow-950" :
                    index === 1 ? "bg-zinc-400 text-zinc-950" :
                    "bg-bronze-500 text-bronze-950"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium flex items-center gap-2">
                      {player.name}
                      {index === 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">Winner</span>}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Final Balance: €{Math.floor(player.balance).toLocaleString()} &middot; Investments: {investments}
                    </div>
                  </div>
                  <div className={`text-lg font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {profit >= 0 ? "+" : ""}{profitPercentage}%
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="p-6 bg-muted/30 border-t">
          <div className="flex gap-4">
            <Link href="/" className="flex-grow">
              <Button
                size="lg"
                variant="outline"
                className="w-full"
              >
                Back to Home
              </Button>
            </Link>
            <Link href="/setup" className="flex-grow">
              <Button
                size="lg"
                className="w-full"
              >
                Play Again
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}