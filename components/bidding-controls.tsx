"use client"

import { usePlayers } from "@/context/players-context"
import { useListings } from "@/context/listings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PartyPopper, TrendingDown, Coins, ArrowRight, Trophy, Euro, Volume2, VolumeX, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from 'canvas-confetti'

const SMALL_WIN_THRESHOLD = 50000
const SMALL_LOSS_THRESHOLD = -50000

interface FloatingSymbolProps {
  emoji: string
  delay?: number
}

// Floating symbols animation
const FloatingSymbol = ({ emoji, delay = 0 }: FloatingSymbolProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0.5, 1.2, 0.5],
      y: [0, -30, -60],
      x: [0, Math.random() * 60 - 30],
    }}
    transition={{
      duration: 2.5,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 3,
      ease: "easeInOut",
    }}
    className="absolute text-2xl pointer-events-none"
    style={{
      left: `${Math.random() * 80 + 10}%`,
      top: `${Math.random() * 80 + 10}%`,
    }}
  >
    {emoji}
  </motion.div>
)

export function BiddingControls() {
  const { players, getPlayerById, updatePlayerBalance } = usePlayers()
  const { currentListing, revealPrice, showPrice } = useListings()
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [result, setResult] = useState<{
    playerName: string
    bidAmount: number
    realPrice: number
    profit: number
  } | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [showFinalResult, setShowFinalResult] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [revealStage, setRevealStage] = useState<'initial' | 'darkening' | 'showing-bid' | 'showing-price' | 'showing-result'>('initial')
  
  // Sound references
  const smallWinSoundRef = useRef<HTMLAudioElement | null>(null)
  const bigWinSoundRef = useRef<HTMLAudioElement | null>(null)
  const smallLossSoundRef = useRef<HTMLAudioElement | null>(null)
  const bigLossSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize audio elements
    smallWinSoundRef.current = new Audio("/small-win.mp3")
    bigWinSoundRef.current = new Audio("/big-win.mp3")
    smallLossSoundRef.current = new Audio("/small-loss.mp3")
    bigLossSoundRef.current = new Audio("/big-loss.mp3")
  }, [])

  const triggerConfetti = (profit: number) => {
    if (profit <= 0) return

    const duration = profit > SMALL_WIN_THRESHOLD ? 3000 : 2000
    const particleCount = profit > SMALL_WIN_THRESHOLD ? 150 : 100

    // First burst
    confetti({
      particleCount,
      spread: 70,
      origin: { y: 0.7 }
    })

    // For big wins, add more celebratory effects
    if (profit > SMALL_WIN_THRESHOLD) {
      setTimeout(() => {
        // Left cannon
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 }
        })

        // Right cannon
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 }
        })
      }, 500)
    }
  }

  const playSound = (profit: number) => {
    if (!isSoundEnabled) return

    // Stop any playing sounds first
    ;[smallWinSoundRef, bigWinSoundRef, smallLossSoundRef, bigLossSoundRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause()
        ref.current.currentTime = 0
      }
    })

    // Play the appropriate sound based on profit/loss amount
    const soundRef = profit > SMALL_WIN_THRESHOLD ? bigWinSoundRef :
                    profit > 0 ? smallWinSoundRef :
                    profit > SMALL_LOSS_THRESHOLD ? smallLossSoundRef :
                    bigLossSoundRef

    if (soundRef.current) {
      soundRef.current.play().catch(console.error)
    }
  }

  const handleRevealPrice = () => {
    if (!selectedPlayerId || !bidAmount || !currentListing) return

    const bid = parseInt(bidAmount.replace(/[^0-9]/g, ""))
    const player = getPlayerById(selectedPlayerId)
    if (!player) return

    const profit = currentListing.realPrice - bid
    updatePlayerBalance(player.id, profit)
    
    setResult({
      playerName: player.name,
      bidAmount: bid,
      realPrice: currentListing.realPrice,
      profit,
    })

    setIsRevealing(true)
    setRevealStage('darkening')
    
    // Play sound immediately
    playSound(profit)
    
    // Staged reveal sequence with adjusted timing
    setTimeout(() => {
      setRevealStage('showing-bid')
    }, 800) // Reduced from 1000ms

    setTimeout(() => {
      setRevealStage('showing-price')
      revealPrice()
    }, 2800) // Reduced from 3000ms

    setTimeout(() => {
      setRevealStage('showing-result')
      setShowFinalResult(true)
      setIsRevealing(false)
      triggerConfetti(profit)
    }, 3800) // Reduced from 4000ms
  }

  const handleNextProperty = () => {
    setSelectedPlayerId("")
    setBidAmount("")
    setResult(null)
    setShowFinalResult(false)
    setRevealStage('initial')
    // Stop any playing sounds
    ;[smallWinSoundRef, bigWinSoundRef, smallLossSoundRef, bigLossSoundRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause()
        ref.current.currentTime = 0
      }
    })
  }

  if (!currentListing) return null

  return (
    <>
      <div className={cn(
        "bg-card rounded-lg border shadow-sm transition-opacity duration-500",
        revealStage !== 'initial' && "opacity-50"
      )}>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold">Bidding Controls</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="h-9 w-9"
          >
            {isSoundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {!showPrice ? (
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Winner</label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Choose the winning player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            {player.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Winning Bid</label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter the winning bid amount"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-lg font-medium"
                onClick={handleRevealPrice}
                disabled={!selectedPlayerId || !bidAmount || isRevealing}
              >
                {isRevealing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <span>Revealing Price</span>
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Coins className="w-5 h-5" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Reveal Price
                  </span>
                )}
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full h-12 text-lg font-medium flex items-center justify-center gap-2"
              onClick={handleNextProperty}
            >
              Next Property
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Full Screen Reveal Animation */}
      <AnimatePresence mode="wait">
        {revealStage !== 'initial' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={revealStage === 'showing-result' ? handleNextProperty : undefined}
          >
            <div className="w-full max-w-2xl p-6 relative flex items-center justify-center min-h-[400px]">
              {/* Bid Amount Reveal */}
              <AnimatePresence mode="wait">
                {revealStage === 'showing-bid' && result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <motion.h3 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl text-white/60 mb-2"
                    >
                      Bid Amount
                    </motion.h3>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.3, 
                        type: "spring", 
                        stiffness: 100, 
                        damping: 20 
                      }}
                      className="text-5xl font-bold text-white"
                    >
                      €{result.bidAmount.toLocaleString()}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Price Reveal */}
              <AnimatePresence mode="wait">
                {revealStage === 'showing-price' && result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <motion.h3 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-3xl text-white/60 mb-4"
                    >
                      Real Price
                    </motion.h3>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.3, 
                        type: "spring", 
                        stiffness: 80, 
                        damping: 15 
                      }}
                      className="text-7xl font-bold text-white"
                    >
                      €{result.realPrice.toLocaleString()}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Final Result */}
              <AnimatePresence mode="wait">
                {revealStage === 'showing-result' && result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 70,
                        damping: 20,
                        delay: 0.2
                      }}
                      className={cn(
                        "w-full max-w-lg rounded-xl border-2 shadow-2xl backdrop-blur p-8",
                        result.profit >= 0
                          ? "bg-green-50/10 border-green-400"
                          : "bg-red-50/10 border-red-400"
                      )}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-3xl font-bold text-white">Final Result</h3>
                        {result.profit >= 0 ? (
                          <PartyPopper className="w-8 h-8 text-green-400" />
                        ) : (
                          <TrendingDown className="w-8 h-8 text-red-400" />
                        )}
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="text-lg text-white/60 mb-1">Winner</div>
                          <div className="text-2xl font-medium text-white">{result.playerName}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-lg text-white/60 mb-1">Bid Amount</div>
                            <div className="text-2xl font-medium text-white">€{result.bidAmount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-lg text-white/60 mb-1">Real Price</div>
                            <div className="text-2xl font-medium text-white">€{result.realPrice.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="h-px bg-white/20" />

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg text-white/60 mb-1">
                              {result.profit >= 0 ? "Total Profit" : "Total Loss"}
                            </div>
                            <div className={cn(
                              "text-5xl font-bold",
                              result.profit >= 0 ? "text-green-400" : "text-red-400"
                            )}>
                              €{Math.abs(result.profit).toLocaleString()}
                            </div>
                          </div>
                          <div className={cn(
                            "px-6 py-3 rounded-full text-xl font-medium",
                            result.profit >= 0
                              ? "bg-green-400/20 text-green-400"
                              : "bg-red-400/20 text-red-400"
                          )}>
                            {((Math.abs(result.profit) / result.realPrice) * 100).toFixed(1)}%
                            <br />
                            {result.profit >= 0 ? "Gain" : "Loss"}
                          </div>
                        </div>

                        <Button
                          size="lg"
                          onClick={handleNextProperty}
                          className={cn(
                            "w-full h-14 text-lg font-medium mt-4",
                            result.profit >= 0 
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          )}
                        >
                          Next Property
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 