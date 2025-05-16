"use client"

import { use, useState, useEffect, useRef } from "react";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import { BiddingControls } from "@/components/bidding-controls";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaderboard } from "@/components/leaderboard";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentListingIndex, incrementCurrentListingIndex, updatePlayerBalance } from "@/lib/supabaseGame";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const [listings, setListings] = useState<any[]>([]);
  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { players, bids, getPlayerBid, submitBid } = useRealtimeGame(gameId);
  const router = useRouter();
  const [biddingEndTime, setBiddingEndTime] = useState<Date | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [resultInfo, setResultInfo] = useState<{ winner: string, amount: number, profit: number, realPrice: number } | null>(null);
  const [resultTimeout, setResultTimeout] = useState<NodeJS.Timeout | null>(null);
  const [resultCountdown, setResultCountdown] = useState(10);
  const [hasBid, setHasBid] = useState(false);
  const [animatedBid, setAnimatedBid] = useState(0);
  const prevBidRef = useRef(0);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasAdvancedRef = useRef(false); // Prevent double advancement
  const balanceUpdatedRef = useRef(false); // Prevent double balance update
  const [revealStep, setRevealStep] = useState<number | null>(null);
  const [revealActive, setRevealActive] = useState(false);
  const [lastRevealedIndex, setLastRevealedIndex] = useState<number | null>(null);

  // Listing and bid calculations (must be above useEffect hooks)
  const currentListing = listings.length > 0 ? listings[currentListingIndex] : null;
  const currentListingIdStr = String(currentListing?.id);
  const currentBids = bids.filter(
    bid => String(bid.listing_id) === currentListingIdStr && String(bid.game_id) === String(gameId)
  );
  const highestBid = currentBids.length > 0 ? Math.max(...currentBids.map(b => b.amount)) : 0;
  const sortedBids = [...currentBids].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const mostRecentHighestBid = sortedBids[0];
  const highestBidder = mostRecentHighestBid ? players.find(p => p.id === mostRecentHighestBid.player_id) : null;

  // Get current playerId from localStorage
  const playerId = typeof window !== "undefined" ? localStorage.getItem("supabasePlayerId") : null;

  // Fetch game state (current_listing_index, bidding_end_time) and listings from backend every second
  useEffect(() => {
    async function fetchGameState() {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('listing_ids, current_listing_index, bidding_end_time')
        .eq('id', gameId)
        .single();
      if (gameError || !game?.listing_ids) return;
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .in('id', game.listing_ids);
      // GUARD: Only update state if listingsData is valid and not empty
      if (listingsError || !listingsData || listingsData.length === 0) return;
      setListings((listingsData || []).map(listing => ({
        ...listing,
        realPrice: listing.real_price
      })));
      // Only update bidding end time, not the listing index
      setBiddingEndTime(game.bidding_end_time ? new Date(game.bidding_end_time) : null);
    }
    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [gameId]);

  // Fetch latest bids for the current property from backend every second
  useEffect(() => {
    async function fetchBids() {
      if (!listings[currentListingIndex]) return;
      const listingId = listings[currentListingIndex].id;
      const { data: bidData, error } = await supabase
        .from('bids')
        .select('*')
        .eq('game_id', gameId)
        .eq('listing_id', listingId);
    }
    fetchBids();
    const interval = setInterval(fetchBids, 1000);
    return () => clearInterval(interval);
  }, [gameId, listings, currentListingIndex]);

  // Timer countdown logic
  useEffect(() => {
    if (!biddingEndTime) {
      setTimer(0);
      return;
    }
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, (biddingEndTime.getTime() - now) / 1000); // use float seconds
      setTimer(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 50); // update every 50ms for smoothness
    return () => clearInterval(interval);
  }, [biddingEndTime, currentListingIndex]);

  // When timer hits zero, show result overlay, update balance, and start countdown (host only)
  useEffect(() => {
    async function handleResult() {
      if (
        timer === 0 &&
        biddingEndTime &&
        !showResult &&
        hasBid &&
        !revealActive &&
        currentListingIndex !== lastRevealedIndex
      ) {
        setResultCountdown(10); // Always reset to 10 when overlay is shown
        if (mostRecentHighestBid && highestBidder && currentListing) {
          const profit = currentListing.realPrice - mostRecentHighestBid.amount;
          setResultInfo({
            winner: highestBidder.name,
            amount: mostRecentHighestBid.amount,
            profit,
            realPrice: currentListing.realPrice
          });
        } else {
          setResultInfo(null);
        }
        // Start animated reveal only if not already active and not already revealed for this property
        setRevealStep(0);
        setRevealActive(true);
        setShowResult(false); // Hide the old modal during animation
        setLastRevealedIndex(currentListingIndex);
        const isHost = typeof window !== "undefined" && localStorage.getItem("supabaseIsHost") === "1";
        if (isHost && mostRecentHighestBid && highestBidder && currentListing) {
          if (!balanceUpdatedRef.current) {
            // Mark the winning bid as won (AWAIT THIS!)
            await supabase
              .from('bids')
              .update({ won: true })
              .eq('id', mostRecentHighestBid.id);
            // Update winner's balance: add profit/loss
            const winner = players.find(p => p.id === mostRecentHighestBid.player_id);
            if (winner) {
              const profit = currentListing.realPrice - mostRecentHighestBid.amount;
              const newBalance = winner.balance + profit;
              updatePlayerBalance(winner.id, newBalance);
            }
            balanceUpdatedRef.current = true;
          }
        }
      }
    }
    handleResult();
    // Cleanup timeout on unmount or round change
    return () => {
      if (resultTimeout) clearTimeout(resultTimeout);
    };
  }, [timer, biddingEndTime, showResult, hasBid, mostRecentHighestBid, highestBidder, players, gameId, currentListing, revealActive, currentListingIndex, lastRevealedIndex]);

  // Animated reveal sequence
  useEffect(() => {
    if (!revealActive) return;
    if (revealStep === null) return;
    let timeout: NodeJS.Timeout;
    if (revealStep < 2) {
      timeout = setTimeout(() => setRevealStep(revealStep + 1), 2500); // 2.5s per step
    } else if (revealStep === 2) {
      timeout = setTimeout(() => {
        setRevealActive(false);
        setShowResult(true);
        setRevealStep(null);
      }, 2500); // Show profit/loss for 2.5s
    }
    return () => clearTimeout(timeout);
  }, [revealStep, revealActive]);

  // Countdown for result overlay and advance property when countdown reaches 0 (host only)
  useEffect(() => {
    if (showResult && resultCountdown > 0) {
      hasAdvancedRef.current = false; // Reset guard for new round
      const interval = setInterval(() => {
        setResultCountdown((prev) => prev - 0.05); // decrease smoothly
      }, 50);
      return () => clearInterval(interval);
    }
  }, [showResult, resultCountdown, gameId]);

  // Log current listing index only when it changes
  useEffect(() => {
    console.log('[Debug] currentListingIndex changed:', currentListingIndex, 'listings.length:', listings.length);
  }, [currentListingIndex, listings.length]);

  // Show final score when we've played all listings
  useEffect(() => {
    if (listings.length > 0 && currentListingIndex >= listings.length) {
      // Redirect to results page
      router.push(`/game/${gameId}/results`);
    }
  }, [currentListingIndex, listings.length, gameId, router]);

  // Hide result overlay and reset countdown and hasBid when property changes
  useEffect(() => {
    setShowResult(false);
    setResultCountdown(10);
    setBiddingEndTime(null);
    setHasBid(false);
    setTimer(8); // Set to 8 seconds for new property
    balanceUpdatedRef.current = false; // Reset for next property
    setRevealActive(false); // <-- Ensure overlay is hidden
    setRevealStep(null);    // <-- Reset animation step
    // Optionally reset any other relevant state here
  }, [currentListingIndex]);

  useEffect(() => {
    if (highestBid !== prevBidRef.current) {
      const start = prevBidRef.current;
      const end = highestBid;
      const duration = 600; // ms
      const startTime = performance.now();
      function animate(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(start + (end - start) * progress);
        setAnimatedBid(value);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedBid(end);
        }
      }
      requestAnimationFrame(animate);
      prevBidRef.current = highestBid;
    }
  }, [highestBid]);

  useEffect(() => {
    if (thumbnailContainerRef.current && thumbnailRefs.current[currentImageIndex]) {
      const container = thumbnailContainerRef.current;
      const button = thumbnailRefs.current[currentImageIndex];
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const offset = buttonRect.left - containerRect.left - containerRect.width / 2 + buttonRect.width / 2;
      container.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }, [currentImageIndex]);

  // When property changes, reset lastRevealedIndex if needed
  useEffect(() => {
    setLastRevealedIndex(null);
  }, [currentListingIndex]);

  if (!currentListing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h1 className="text-4xl font-bold mb-8">Loading property...</h1>
      </div>
    );
  }

  const nextImage = () => {
    if (currentListing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % currentListing.images.length);
    }
  };

  const prevImage = () => {
    if (currentListing.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + currentListing.images.length) % currentListing.images.length);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex flex-col dark">
      {/* Animated Bid Result Overlay */}
      <AnimatePresence>
        {revealActive && (
          <motion.div
            key="reveal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95"
          >
            <motion.div
              key={revealStep}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.7 }}
              className="text-center"
            >
              {revealStep === 0 && mostRecentHighestBid && highestBidder && (
                <>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-4">Bid won by {highestBidder.name}{highestBidder.investment_bank ? ` from bank ${highestBidder.investment_bank}` : ""}</div>
                </>
              )}
              {revealStep === 1 && mostRecentHighestBid && (
                <>
                  <div className="text-lg md:text-xl text-gray-200 mb-2">Purchase Price</div>
                  <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">€{mostRecentHighestBid.amount.toLocaleString()}</div>
                </>
              )}
              {revealStep === 2 && resultInfo && (
                <>
                  <div className="text-lg md:text-xl text-gray-200 mb-2">Listing Price</div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">€{resultInfo.realPrice?.toLocaleString()}</div>
                  <div className={
                    resultInfo.profit > 0
                      ? "text-2xl font-bold text-green-400 mt-6"
                      : resultInfo.profit < 0
                      ? "text-2xl font-bold text-red-400 mt-6"
                      : "text-2xl font-bold text-gray-300 mt-6"
                  }>
                    {resultInfo.profit > 0 ? `Profit: +€${resultInfo.profit.toLocaleString()}` : resultInfo.profit < 0 ? `Loss: -€${Math.abs(resultInfo.profit).toLocaleString()}` : "No profit/loss"}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
            <span className="font-bold tracking-tight">Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Property</span>
            <span className="w-12 text-center font-medium">
              {currentListingIndex + 1}/{listings.length}
            </span>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col items-center justify-center px-2 py-6">
        <div className="w-full max-w-7xl flex flex-col items-center gap-10">
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-10">
            {/* Leaderboard */}
            <Card className="w-full max-w-xs shadow-2xl rounded-3xl border-0 bg-card/80 backdrop-blur-lg p-0 flex-shrink-0">
              <CardContent className="p-0">
                <Leaderboard players={players} />
              </CardContent>
            </Card>
            {/* Main Property Card */}
            <Card className="w-full max-w-2xl shadow-2xl rounded-3xl border-0 bg-card/90 backdrop-blur-lg flex flex-col items-center">
              <CardContent className="space-y-6 w-full flex flex-col items-center">
                {/* Property Title and Details */}
                <div className="pt-2 w-full text-center">
                  <h1 className="text-4xl font-extrabold text-primary mb-1 leading-tight">{currentListing.title}</h1>
                  <div className="text-lg text-muted-foreground mb-2">{currentListing.area} · {currentListing.size} · {currentListing.rooms}</div>
                </div>
                {/* Unified Image Gallery Card: main image and thumbnails inside the same card, no overflow */}
                <Card className="w-full max-w-xl mx-auto shadow-2xl rounded-2xl border-0 bg-card/90 backdrop-blur-lg flex flex-col items-center overflow-hidden p-0">
                  <div className="relative w-full flex items-center justify-center bg-transparent" style={{ minHeight: '24rem' }}>
                    {currentListing.images.length > 1 && (
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + currentListing.images.length) % currentListing.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 shadow-lg backdrop-blur z-10 transition"
                        style={{ outline: 'none' }}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    )}
                    <div className="flex-1 flex justify-center items-center">
                      <img
                        src={currentListing.images[currentImageIndex] || "/placeholder.svg"}
                        alt={currentListing.title}
                        className="object-cover rounded-2xl max-h-96 w-full max-w-xl bg-gray-900/60 shadow-lg border border-border transition-all duration-300"
                      />
                    </div>
                    {currentListing.images.length > 1 && (
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % currentListing.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 shadow-lg backdrop-blur z-10 transition"
                        style={{ outline: 'none' }}
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  {currentListing.images.length > 1 && (
                    <div
                      ref={thumbnailContainerRef}
                      className="w-full pl-2 pr-2 pb-2 overflow-x-auto scrollbar-hide flex gap-3 justify-center mt-2 bg-transparent scroll-px-2"
                      style={{ WebkitOverflowScrolling: 'touch' }}
                    >
                      {currentListing.images.map((image: string, index: number) => (
                        <button
                          key={index}
                          ref={el => { thumbnailRefs.current[index] = el; }}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative h-16 w-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 shadow-sm
                            ${index === currentImageIndex
                              ? "border-primary ring-2 ring-primary scale-105 shadow-lg z-10"
                              : "border-border hover:border-primary/50 opacity-80"}
                          `}
                          style={{ outline: 'none' }}
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Thumbnail ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              </CardContent>
            </Card>
            {/* Right Column: Current Highest Bid above Bidding Controls */}
            <div className="w-full max-w-xs flex flex-col gap-8 flex-shrink-0">
              {/* Current Highest Bid Card */}
              <Card className="w-full shadow-2xl rounded-3xl border-0 bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-gray-800/90 backdrop-blur-xl ring-2 ring-primary/20 mx-auto min-h-[240px] md:min-h-[320px] flex justify-center">
                <CardContent className="px-4 md:px-10 py-8 md:py-10 text-center flex flex-col items-center w-full h-full justify-center pb-10">
                  {timer === 0 && biddingEndTime && hasBid && showResult ? (
                    <>
                      {mostRecentHighestBid && highestBidder && resultInfo ? (
                        <>
                          <span className="block text-lg md:text-xl text-gray-100 mb-2">{highestBidder.name} bought this property for</span>
                          <span className="block text-3xl md:text-4xl font-extrabold text-white mb-2">€{mostRecentHighestBid.amount.toLocaleString()}</span>
                          <span className="block text-lg md:text-xl text-gray-400 mb-2">Listing Price: <span className="font-bold text-white">€{resultInfo.realPrice?.toLocaleString()}</span></span>
                          <hr className="my-4 w-2/3 border-gray-700 mx-auto" />
                          <span className={
                            resultInfo.profit > 0
                              ? "block text-2xl font-bold text-green-400 mb-2"
                              : resultInfo.profit < 0
                              ? "block text-2xl font-bold text-red-400 mb-2"
                              : "block text-2xl font-bold text-gray-300 mb-2"
                          }>
                            {resultInfo.profit > 0 ? `Profit: +€${resultInfo.profit.toLocaleString()}` : resultInfo.profit < 0 ? `Loss: -€${Math.abs(resultInfo.profit).toLocaleString()}` : "No profit/loss"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block text-2xl md:text-3xl font-bold text-red-400 mb-2 mt-4 md:mt-8 drop-shadow">No Bids!</span>
                          <span className="block text-lg md:text-xl text-gray-100 mb-2">No one bought this property.</span>
                        </>
                      )}
                      {/* Host-only Next Property button (always visible, timer/progress removed) */}
                      {typeof window !== "undefined" && localStorage.getItem("supabaseIsHost") === "1" && (
                        <div className="w-full flex justify-center pt-2 pb-2">
                          <Button
                            className="w-full max-w-xs mx-auto"
                            onClick={async () => {
                              await incrementCurrentListingIndex(gameId);
                              // Update the local state after incrementing the backend
                              const newIndex = await getCurrentListingIndex(gameId);
                              setCurrentListingIndex(newIndex);
                              setShowResult(false);
                            }}
                          >
                            Next Property
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="block text-lg md:text-xl font-bold text-primary mb-2 tracking-wide mt-2 md:mt-4">Current Highest Bid</span>
                      <span className="block text-4xl md:text-5xl font-extrabold text-primary drop-shadow-lg mb-2">
                        €{animatedBid.toLocaleString()}
                      </span>
                      {/* Always reserve space for 'by {name}' */}
                      <div className={`flex items-center justify-center gap-2 mt-2 text-base md:text-lg text-primary font-medium min-h-[28px]`}>
                        {highestBidder ? (
                          <>by {highestBidder.name}</>
                        ) : (
                          <span className="opacity-0 select-none">by</span>
                        )}
                      </div>
                      {/* Always show timer/progress bar */}
                      <div className="w-full mt-4 md:mt-6 min-h-[40px] flex flex-col justify-end">
                        <span className="block text-xs text-gray-400 mb-1">Time left to bid</span>
                        <Progress value={timer > 0 ? timer * 100 / 8 : 0} className={`h-4 md:h-5 rounded-full bg-gray-700 [&_.bg-primary]:${timer > 0 ? 'bg-red-500/80' : 'bg-gray-600/60'} shadow-inner`} />
                      </div>
                      {biddingEndTime && timer === 0 && hasBid && (
                        <div className="mt-4 text-base md:text-lg font-bold text-red-400">Sold!</div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              {/* Bidding Controls Card */}
              {gameId && playerId && currentListing && (
                <Card className="w-full shadow-2xl rounded-3xl border-0 bg-card/80 backdrop-blur-lg flex-shrink-0 min-h-[240px] md:min-h-[320px] flex flex-col justify-center">
                  <CardContent>
                    <BiddingControls
                      gameId={gameId}
                      currentPlayerId={playerId}
                      listingId={currentListing.id}
                      bids={bids}
                      getPlayerBid={getPlayerBid}
                      submitBid={async (playerId, listingId, amount) => {
                        try {
                          setHasBid(true);
                          const result = await submitBid(playerId, listingId, amount);
                          const { data: bidData } = await supabase
                            .from('bids')
                            .select('*')
                            .eq('game_id', gameId)
                            .eq('listing_id', currentListing.id);
                          return result;
                        } catch (error) {
                          if (error instanceof Error) {
                            alert(error.message);
                          } else {
                            alert('Failed to place bid. Please try again.');
                          }
                          return null;
                        }
                      }}
                      disabled={biddingEndTime !== null && timer === 0}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}