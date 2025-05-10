"use client"

import { usePlayers } from "@/context/players-context"
import { useListings } from "@/context/listings-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PartyPopper, TrendingDown, Coins, ArrowRight, Trophy, Euro, Volume2, VolumeX, Sparkles, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import confetti from 'canvas-confetti'
import { Label } from "@/components/ui/label"
import { BackgroundMusic } from "@/components/background-music"
import { useCredit } from "@/context/credit-context"
import { CreditScore } from "@/components/credit-score"
import { Checkbox } from "@/components/ui/checkbox"
import { getInterventionForBid, type BankIntervention, firstLoanCelebrationIntervention } from "@/lib/bank-interventions"
import Image from "next/image"

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

interface ExtendedAudioElement extends HTMLAudioElement {
  fadeOut: () => Promise<void>;
  fadeIn: () => Promise<void>;
  enableMusic: () => void;
}

export function BiddingControls() {
  const { players, getPlayerById, updatePlayerBalance } = usePlayers()
  const { currentListing, revealPrice, showPrice, setShowPrice, nextListing, currentListingIndex, listings, setBidResult } = useListings()
  const { updateCreditScore, getInterestRate } = useCredit()
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [bidAmount, setBidAmount] = useState("")
  const [result, setResult] = useState<{
    playerName: string
    bidAmount: number
    loanAmount: number
    interestRate: number
    realPrice: number
    profit: number
  } | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [showFinalResult, setShowFinalResult] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [revealStage, setRevealStage] = useState<'initial' | 'darkening' | 'showing-bid' | 'showing-price' | 'showing-result'>('initial')
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFloatingSymbols, setShowFloatingSymbols] = useState(false)
  const [backgroundMusicRef, setBackgroundMusicRef] = useState<ExtendedAudioElement | null>(null)
  const [currentIntervention, setCurrentIntervention] = useState<BankIntervention | null>(null);
  
  // Sound references
  const smallWinSoundRef = useRef<HTMLAudioElement | null>(null)
  const bigWinSoundRef = useRef<HTMLAudioElement | null>(null)
  const smallLossSoundRef = useRef<HTMLAudioElement | null>(null)
  const bigLossSoundRef = useRef<HTMLAudioElement | null>(null)

  const selectedPlayer = selectedPlayerId ? getPlayerById(selectedPlayerId) : null

  // Track which players have used a loan before
  const [playersWithLoan, setPlayersWithLoan] = useState<{ [playerId: string]: boolean }>({});

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

  const playSound = async (profit: number) => {
    if (!isSoundEnabled) return

    // Fade out background music first
    if (backgroundMusicRef?.fadeOut) {
      try {
        await backgroundMusicRef.fadeOut()
      } catch (error) {
        console.error("Error fading out background music:", error)
      }
    }

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
      try {
        // Set initial volume and play
        soundRef.current.volume = 1
        await soundRef.current.play()
        
        // After 9 seconds, start fading out the result sound
        setTimeout(() => {
          const audio = soundRef.current
          if (audio) {
            // Fade out over 1 second
            const fadeSteps = 20
            const fadeInterval = 1000 / fadeSteps // 1 second fade
            let step = 0
            
            const fadeOutInterval = setInterval(() => {
              step++
              if (step >= fadeSteps) {
                if (audio) {
                  audio.pause()
                  audio.currentTime = 0
                }
                clearInterval(fadeOutInterval)
                
                // After result sound is fully faded out, fade in background music
                if (backgroundMusicRef) {
                  // First enable the music
                  backgroundMusicRef.enableMusic()
                  // Then fade it in
                  try {
                    backgroundMusicRef.fadeIn()
                  } catch (error) {
                    console.error("Error fading in background music:", error)
                  }
                }
              } else if (audio) {
                audio.volume = 1 - (step / fadeSteps)
              }
            }, fadeInterval)
          }
        }, 9000) // Start fade out after 9 seconds
      } catch (error) {
        console.error("Error playing sound effect:", error)
      }
    }
  }

  useEffect(() => {
    // Initialize audio elements
    smallWinSoundRef.current = new Audio("/small-win.mp3")
    bigWinSoundRef.current = new Audio("/big-win.mp3")
    smallLossSoundRef.current = new Audio("/small-loss.mp3")
    bigLossSoundRef.current = new Audio("/big-loss.mp3")

    return () => {
      // Cleanup audio elements
      ;[smallWinSoundRef, bigWinSoundRef, smallLossSoundRef, bigLossSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause()
          ref.current.src = ""
        }
      })
    }
  }, [])

  const handleBidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-digits
    const value = e.target.value.replace(/\D/g, '')
    // Format with commas
    const formattedValue = value ? parseInt(value).toLocaleString() : ""
    setBidAmount(formattedValue)
  }

  const handleBid = async () => {
    if (!selectedPlayer || !currentListing || !bidAmount) return;

    const totalBidAmount = parseInt(bidAmount.replace(/\D/g, ''));
    const availableFunds = selectedPlayer.balance;
    const needsLoan = totalBidAmount > availableFunds;
    
    // Get player's credit score for intervention check
    const playerCreditScore = selectedPlayer.creditScore || 750; // Default to 750 if not set
    
    // First loan celebration logic
    if (needsLoan && !playersWithLoan[selectedPlayer.id]) {
      setCurrentIntervention(firstLoanCelebrationIntervention);
      setPlayersWithLoan(prev => ({ ...prev, [selectedPlayer.id]: true }));
      return;
    }

    // Check for bank intervention based on credit score, loan need, and balance
    const intervention = getInterventionForBid(playerCreditScore, needsLoan, availableFunds);
    if (intervention) {
      setCurrentIntervention(intervention);
      return;
    }

    // If no intervention, proceed with bid
    proceedWithBid();
  };

  const proceedWithBid = async () => {
    if (!selectedPlayer || !currentListing || !bidAmount) return;

    const totalBidAmount = parseInt(bidAmount.replace(/\D/g, ''));
    const availableFunds = selectedPlayer.balance;
    let loanAmount = 0;
    let interestRate = 0;

    // Update credit score based on profit/loss and loan usage
    // We'll call this after profit and loanAmount are calculated

    // Calculate if a loan is needed - only borrow what's needed
    if (totalBidAmount > availableFunds) {
      // Ensure we only borrow what we can't cover with available funds
      loanAmount = Math.max(0, totalBidAmount - availableFunds)
      // Get interest rate AFTER credit score has been updated
      interestRate = getInterestRate(selectedPlayer.id)

      console.log('Loan Calculation:', {
        totalBidAmount,
        availableFunds,
        loanAmount,
        interestRate
      })
    }

    // Calculate profit/loss including loan costs
    const loanCost = loanAmount * interestRate
    const profit = currentListing.realPrice - totalBidAmount - loanCost

    console.log('Final Calculation:', {
      realPrice: currentListing.realPrice,
      totalBidAmount,
      loanAmount,
      interestRate,
      loanCost,
      profit
    })

    // Now update credit score with profit and loan info
    updateCreditScore(selectedPlayer.id, currentListing.realPrice, totalBidAmount, profit, loanAmount)

    // Update player's balance with the final result
    if (loanAmount > 0) {
      // If taking a loan:
      // 1. Use all available funds
      updatePlayerBalance(selectedPlayer.id, -availableFunds)
      // 2. Take the loan for the remaining amount and pay interest
      updatePlayerBalance(selectedPlayer.id, -loanAmount - loanCost)
      // 3. Add the real price
      updatePlayerBalance(selectedPlayer.id, currentListing.realPrice)
    } else {
      // If no loan needed, simply deduct bid and add real price
      updatePlayerBalance(selectedPlayer.id, -totalBidAmount)
      updatePlayerBalance(selectedPlayer.id, currentListing.realPrice)
    }
    
    // Set result
    setResult({
      playerName: selectedPlayer.name,
      bidAmount: totalBidAmount,
      loanAmount,
      interestRate,
      realPrice: currentListing.realPrice,
      profit,
    })
    
    setShowPrice(true)

    // Start the reveal sequence
    setIsRevealing(true)
    setRevealStage('darkening')
    
    // Play sound with proper background music handling
    await playSound(profit)
    
    // Staged reveal sequence with adjusted timing
    setTimeout(() => {
      setRevealStage('showing-bid')
    }, 800)

    setTimeout(() => {
      setRevealStage('showing-price')
      revealPrice()
    }, 2800)

    setTimeout(() => {
      setRevealStage('showing-result')
      setShowFinalResult(true)
      setIsRevealing(false)
      triggerConfetti(profit)
    }, 3800)
  }

  const handleRevealPrice = async () => {
    if (!selectedPlayerId || !bidAmount || !currentListing) return

    const bid = parseInt(bidAmount.replace(/[^0-9]/g, ""))
    const player = getPlayerById(selectedPlayerId)
    if (!player) return

    const profit = currentListing.realPrice - bid
    updatePlayerBalance(player.id, profit)
    
    setResult({
      playerName: player.name,
      bidAmount: bid,
      loanAmount: 0,
      interestRate: 0,
      realPrice: currentListing.realPrice,
      profit,
    })

    setIsRevealing(true)
    setRevealStage('darkening')
    
    // Play sound with proper background music handling
    await playSound(profit)
    
    // Staged reveal sequence with adjusted timing
    setTimeout(() => {
      setRevealStage('showing-bid')
    }, 800)

    setTimeout(() => {
      setRevealStage('showing-price')
      revealPrice()
    }, 2800)

    setTimeout(() => {
      setRevealStage('showing-result')
      setShowFinalResult(true)
      setIsRevealing(false)
      triggerConfetti(profit)
    }, 3800)
  }

  const handleNextProperty = () => {
    // Only proceed if we're not at the last property
    if (currentListingIndex >= listings.length - 1) {
      return
    }

    // Reset all state first
    setSelectedPlayerId("")
    setBidAmount("")
    setShowFinalResult(false)
    setRevealStage('initial')
    setShowPrice(false)
    
    // Stop any playing sounds
    ;[smallWinSoundRef, bigWinSoundRef, smallLossSoundRef, bigLossSoundRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause()
        ref.current.currentTime = 0
      }
    })

    // Move to next property after a small delay to ensure state updates are processed
    setTimeout(() => {
      nextListing()
    }, 0)
  }

  // Initialize result from currentListing.bidResult only once on mount or when currentListing changes
  useEffect(() => {
    if (currentListing?.bidResult && !result) {
      setResult(currentListing.bidResult)
    }
  }, [currentListing])

  // Store result in listing context only when it's set from a new bid
  useEffect(() => {
    if (result && showFinalResult) {
      setBidResult(result)
    }
  }, [showFinalResult])

  if (!currentListing) return null

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-6 flex-grow">
        <div className="space-y-2">
          <Label htmlFor="player" className="text-lg">
            Select Player
          </Label>
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger className="text-lg p-6">
              <SelectValue placeholder="Choose who is bidding" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem
                  key={player.id}
                  value={player.id}
                  disabled={currentListing?.agentId === player.id}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{player.name}</span>
                    {currentListing?.agentId === player.id && (
                      <span className="text-sm text-muted-foreground ml-2">(Agent)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPlayerId && currentListing?.agentId === selectedPlayerId && (
            <p className="text-sm text-destructive">
              You cannot bid on your own listing as the agent
            </p>
          )}
        </div>

        {selectedPlayerId && (
          <>
            <div className="space-y-2">
              <Label htmlFor="bidAmount" className="text-lg">
                Bid Amount (€)
              </Label>
              <Input
                id="bidAmount"
                type="text"
                value={bidAmount}
                onChange={handleBidAmountChange}
                placeholder="Enter bid amount"
                className="text-lg p-6"
              />
              {selectedPlayer && parseInt(bidAmount) > selectedPlayer.balance && (
                <p className="text-sm text-muted-foreground">
                  A loan will be automatically taken for €{Math.floor(parseInt(bidAmount) - selectedPlayer.balance).toLocaleString()} at {(getInterestRate(selectedPlayer.id) * 100).toFixed(1)}% interest
                </p>
              )}

              <Button
                size="lg"
                className="w-full h-16 text-xl font-medium mt-4"
                onClick={handleBid}
                disabled={!selectedPlayerId || !bidAmount || currentListing?.agentId === selectedPlayerId}
              >
                <>
                  Place Bid
                  <ArrowRight className="w-6 h-6 ml-2" />
                </>
              </Button>
            </div>
          </>
        )}

        <div className={cn(
          "bg-card rounded-lg border shadow-sm transition-opacity duration-500",
          revealStage !== 'initial' && "opacity-50"
        )}>
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold">Sound Controls</h2>
            <div className="flex items-center gap-2">
              <BackgroundMusic onMusicRef={setBackgroundMusicRef} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="h-9 w-9"
                title={isSoundEnabled ? "Mute sound effects" : "Unmute sound effects"}
              >
                {isSoundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Previous Bid Result */}
        {currentListing?.bidResult && !isRevealing && !showFinalResult && (
          <div className={cn(
            "bg-card rounded-lg border shadow-sm p-6 space-y-4",
            currentListing.bidResult.profit >= 0 ? "border-green-500" : "border-red-500"
          )}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Previous Bid Result</h3>
              {currentListing.bidResult.profit >= 0 ? (
                <PartyPopper className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Winner</div>
                <div className="font-medium">{currentListing.bidResult.playerName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bid Amount</div>
                <div className="font-medium">€{Math.floor(currentListing.bidResult.bidAmount).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Real Price</div>
                <div className="font-medium">€{Math.floor(currentListing.bidResult.realPrice).toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-sm text-muted-foreground">
                  {currentListing.bidResult.profit >= 0 ? "Profit" : "Loss"}
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  currentListing.bidResult.profit >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  €{Math.floor(Math.abs(currentListing.bidResult.profit)).toLocaleString()}
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                currentListing.bidResult.profit >= 0
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              )}>
                {((Math.abs(currentListing.bidResult.profit) / currentListing.bidResult.realPrice) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
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
                      €{Math.floor(result.bidAmount).toLocaleString()}
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
                      €{Math.floor(result.realPrice).toLocaleString()}
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
                            <div className="text-2xl font-medium text-white">€{Math.floor(result.bidAmount).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-lg text-white/60 mb-1">Real Price</div>
                            <div className="text-2xl font-medium text-white">€{Math.floor(result.realPrice).toLocaleString()}</div>
                          </div>
                        </div>

                        {result.loanAmount > 0 && (
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className="text-lg text-white/60 mb-1">Loan Amount</div>
                              <div className="text-2xl font-medium text-white">€{Math.floor(result.loanAmount).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-lg text-white/60 mb-1">Interest Rate</div>
                              <div className="text-2xl font-medium text-white">{(result.interestRate * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        )}

                        <div className="h-px bg-white/20" />

                        {/* New Calculation Breakdown Section */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                          <div className="text-lg text-white/60">Calculation Breakdown:</div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-white/80">Price Difference:</div>
                            <div className={cn(
                              "text-right font-medium",
                              result.realPrice >= result.bidAmount ? "text-green-400" : "text-red-400"
                            )}>
                              €{Math.floor(Math.abs(result.realPrice - result.bidAmount)).toLocaleString()}
                              {result.realPrice >= result.bidAmount ? " profit" : " loss"}
                            </div>
                          </div>

                          {result.loanAmount > 0 && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-white/80">Loan Interest Cost:</div>
                              <div className="text-right font-medium text-red-400">
                                €{Math.floor(result.loanAmount * result.interestRate).toLocaleString()} loss
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg text-white/60 mb-1">
                              {result.profit >= 0 ? "Total Profit" : "Total Loss"}
                            </div>
                            <div className={cn(
                              "text-5xl font-bold",
                              result.profit >= 0 ? "text-green-400" : "text-red-400"
                            )}>
                              €{Math.floor(Math.abs(result.profit)).toLocaleString()}
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

      {/* Bank Intervention Modal */}
      <AnimatePresence>
        {currentIntervention && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                duration: 0.4,
                delay: 0.2,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              className={cn(
                "bg-card border-2 p-0 rounded-xl shadow-2xl max-w-3xl max-h-[90vh] w-full mx-4 overflow-hidden flex",
                currentIntervention.type === 'celebration' 
                  ? "border-green-500" 
                  : "border-primary"
              )}
            >
              <div className="flex flex-col md:flex-row items-stretch w-full min-h-[420px] max-h-[90vh]">
                <div className="md:w-1/2 w-full min-w-[340px] flex flex-col items-center justify-start bg-muted p-0 border-r border-border min-h-[420px] max-h-[90vh]">
                  <div className="relative w-full h-full flex flex-col items-center justify-start">
                    <div className="relative w-full h-[420px] flex items-center justify-center">
                      <Image src="/banker.png" alt="Booze Bank LTD Personnel" fill priority className="object-cover w-full h-full rounded-lg border-4 border-primary bg-white shadow-lg" />
                    </div>
                    <div className="mt-4 text-2xl font-bold text-primary text-center">Pekka Pullukka</div>
                    <div className="text-base font-medium text-muted-foreground text-center">Booze Bank LTD</div>
                  </div>
                </div>
                <div className="md:w-1/2 w-full min-w-[340px] flex flex-col justify-start items-start p-6 md:p-8 min-h-[420px] max-h-[90vh] overflow-y-auto">
                  <motion.div 
                    className="space-y-6"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.15
                        }
                      }
                    }}
                  >
                    <motion.div 
                      className="flex items-center gap-4"
                      variants={{
                        hidden: { opacity: 0, y: -20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      {currentIntervention.type === 'celebration' ? (
                        <>
                          <PartyPopper className="w-8 h-8 text-green-500" />
                          <h2 className="text-2xl font-bold text-green-500">
                            Message from the Bank
                          </h2>
                        </>
                      ) : (
                        <>
                          <Bell className="w-8 h-8 text-red-500 animate-ring" />
                          <h2 className="text-2xl font-bold text-red-500">
                            Message from the Bank
                          </h2>
                        </>
                      )}
                    </motion.div>

                    <motion.div 
                      className="space-y-6"
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      {/* Bank Statement */}
                      <div className="space-y-4">
                        <p className="text-xl font-medium text-muted-foreground">
                          {currentIntervention.bankStatement}
                        </p>
                        
                        <div className="h-px bg-muted" />
                        
                        <p className="text-sm text-muted-foreground">
                          {currentIntervention.severity}
                        </p>
                      </div>

                      {/* Challenge */}
                      <div className={cn(
                        "mt-6 p-6 rounded-lg border-2",
                        currentIntervention.type === 'celebration'
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-destructive/5 border-destructive/20"
                      )}>
                        <h3 className={cn(
                          "text-lg font-semibold mb-2",
                          currentIntervention.type === 'celebration'
                            ? "text-green-500"
                            : "text-destructive"
                        )}>
                          {currentIntervention.type === 'celebration' 
                            ? "Celebratory Action Required"
                            : "Mandatory Liquidity Adjustment"}
                        </h3>
                        <p className="text-muted-foreground">
                          {currentIntervention.description}
                        </p>
                        <div className="mt-4 text-xl font-bold">
                          {currentIntervention.challenge}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-muted-foreground">Severity Level:</span>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          currentIntervention.difficulty === 'easy' && "bg-green-500/20 text-green-500",
                          currentIntervention.difficulty === 'medium' && "bg-yellow-500/20 text-yellow-500",
                          currentIntervention.difficulty === 'hard' && "bg-red-500/20 text-red-500"
                        )}>
                          {currentIntervention.difficulty.toUpperCase()}
                        </span>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="flex gap-4 pt-4"
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedPlayerId("");
                          setBidAmount("");
                          setCurrentIntervention(null);
                        }}
                      >
                        {currentIntervention.type === 'celebration' 
                          ? "Respectfully Decline" 
                          : "Reject Terms"}
                      </Button>
                      <Button
                        className={cn(
                          "flex-1",
                          currentIntervention.type === 'celebration'
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-destructive hover:bg-destructive/90"
                        )}
                        onClick={() => {
                          setCurrentIntervention(null);
                          proceedWithBid();
                        }}
                      >
                        {currentIntervention.type === 'celebration' 
                          ? "Accept Honor" 
                          : "Accept Terms"}
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 