"use client"

import { use, useState, useEffect } from "react";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import { BiddingControls } from "@/components/bidding-controls";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaderboard } from "@/components/leaderboard";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentListingIndex, incrementCurrentListingIndex, updatePlayerBalance } from "@/lib/supabaseGame";

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
  const [resultInfo, setResultInfo] = useState<{ winner: string, amount: number } | null>(null);
  const [resultTimeout, setResultTimeout] = useState<NodeJS.Timeout | null>(null);
  const [resultCountdown, setResultCountdown] = useState(10);
  const [hasBid, setHasBid] = useState(false);

  // Listing and bid calculations (must be above useEffect hooks)
  const currentListing = listings.length > 0 ? listings[currentListingIndex] : null;
  const currentListingIdStr = String(currentListing?.id);
  const currentBids = bids.filter(bid => String(bid.listing_id) === currentListingIdStr);
  const highestBid = currentBids.length > 0 ? Math.max(...currentBids.map(b => b.amount)) : 0;
  const sortedBids = [...currentBids].sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const mostRecentHighestBid = sortedBids[0];
  const highestBidder = mostRecentHighestBid ? players.find(p => p.id === mostRecentHighestBid.player_id) : null;

  // Get current playerId from localStorage
  const playerId = typeof window !== "undefined" ? localStorage.getItem("supabasePlayerId") : null;

  // Fetch only the listings for this game, and subscribe to bidding_end_time
  useEffect(() => {
    async function fetchGameListings() {
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
      if (listingsError) return;
      setListings(listingsData || []);
      setCurrentListingIndex(game.current_listing_index ?? 0);
      setBiddingEndTime(game.bidding_end_time ? new Date(game.bidding_end_time) : null);
    }
    fetchGameListings();
    // Poll for current_listing_index and bidding_end_time every 1 second
    const interval = setInterval(fetchGameListings, 1000);
    return () => clearInterval(interval);
  }, [gameId]);

  // Timer countdown logic
  useEffect(() => {
    if (!biddingEndTime) {
      setTimer(0);
      return;
    }
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((biddingEndTime.getTime() - now) / 1000));
      setTimer(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 250);
    return () => clearInterval(interval);
  }, [biddingEndTime, currentListingIndex]);

  // When timer hits zero, show result overlay, update balance, and start countdown (host only)
  useEffect(() => {
    if (timer === 0 && biddingEndTime && !showResult && hasBid) {
      setResultCountdown(10); // Always reset to 10 when overlay is shown
      if (mostRecentHighestBid && highestBidder) {
        setResultInfo({ winner: highestBidder.name, amount: mostRecentHighestBid.amount });
      } else {
        setResultInfo(null);
      }
      setShowResult(true);
      const isHost = typeof window !== "undefined" && localStorage.getItem("supabaseIsHost") === "1";
      if (isHost && mostRecentHighestBid && highestBidder) {
        // Update winner's balance
        const winner = players.find(p => p.id === mostRecentHighestBid.player_id);
        if (winner) {
          updatePlayerBalance(winner.id, winner.balance - mostRecentHighestBid.amount);
        }
      }
    }
    // Cleanup timeout on unmount or round change
    return () => {
      if (resultTimeout) clearTimeout(resultTimeout);
    };
  }, [timer, biddingEndTime, showResult, hasBid, mostRecentHighestBid, highestBidder, players, gameId]);

  // Countdown for result overlay and advance property when countdown reaches 0 (host only)
  useEffect(() => {
    if (showResult && resultCountdown > 0) {
      const interval = setInterval(() => {
        setResultCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (showResult && resultCountdown === 0) {
      const isHost = typeof window !== "undefined" && localStorage.getItem("supabaseIsHost") === "1";
      if (isHost) {
        incrementCurrentListingIndex(gameId);
      }
      setShowResult(false);
    }
  }, [showResult, resultCountdown, gameId]);

  // Show final score when we've played all listings
  useEffect(() => {
    if (listings.length > 0 && currentListingIndex >= listings.length) {
      setShowFinalScore(true);
    }
  }, [currentListingIndex, listings.length]);

  // Hide result overlay and reset countdown and hasBid when property changes
  useEffect(() => {
    setShowResult(false);
    setResultCountdown(10);
    setBiddingEndTime(null);
    setHasBid(false);
    setTimer(5);
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-6 flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg">
            <span className="font-medium">Home</span>
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
      <main className="flex-1 w-full px-6 py-4 grid grid-cols-12 gap-6 h-[calc(100vh-3.5rem)]">
        {/* Left Column - Leaderboard */}
        <div className="col-span-3 min-w-[300px] overflow-auto">
          <Leaderboard players={players} />
        </div>

        {/* Middle Column - Property Details and Current Bid */}
        <div className="col-span-6 min-w-[500px] overflow-auto flex flex-col items-center">
          <div className="space-y-4 w-full max-w-2xl mx-auto">
            {/* Property Title and Details */}
            <div>
              <h1 className="text-2xl font-bold text-center">{currentListing.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground justify-center">
                <span>{currentListing.area} · {currentListing.size} · {currentListing.rooms}</span>
              </div>
            </div>
            {/* Main Image */}
            <div className="w-full flex justify-center">
              <img
                src={currentListing.images[currentImageIndex] || "/placeholder.svg"}
                alt={currentListing.title}
                className="object-cover rounded-lg max-h-96 w-full max-w-xl bg-gray-100"
              />
            </div>
            {/* Image Thumbnails */}
            {currentListing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto justify-center">
                {currentListing.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-16 w-24 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
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
            {/* Current Bid Display */}
            <div className="w-full flex justify-center my-4">
              <div className="bg-primary/10 border border-primary rounded-lg px-8 py-4 text-center">
                <span className="text-lg font-semibold text-primary">Current Highest Bid: </span>
                <span className="text-2xl font-bold text-primary">€{highestBid.toLocaleString()}</span>
                {highestBidder && (
                  <div className="mt-2 text-base text-primary font-medium">
                    by {highestBidder.name}
                  </div>
                )}
                {/* Bidding Timer */}
                {biddingEndTime && (
                  <div className="mt-2 text-lg font-bold text-red-600">
                    {timer > 0
                      ? `Time left: ${timer}s`
                      : hasBid
                        ? "Sold!"
                        : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Bidding Controls */}
        <div className="col-span-3 min-w-[300px] overflow-auto flex flex-col items-center">
          {gameId && playerId && currentListing && (
            <div className="w-full max-w-xs mt-8">
              <BiddingControls
                gameId={gameId}
                currentPlayerId={playerId}
                listingId={currentListing.id}
                bids={bids}
                getPlayerBid={getPlayerBid}
                submitBid={async (...args) => {
                  setHasBid(true);
                  const result = await submitBid(...args);
                  // Fetch updated bidding_end_time from Supabase
                  const { data: game } = await supabase
                    .from('games')
                    .select('bidding_end_time')
                    .eq('id', gameId)
                    .single();
                  if (game?.bidding_end_time) {
                    setBiddingEndTime(new Date(game.bidding_end_time));
                  }
                  return result;
                }}
                disabled={!!biddingEndTime && timer === 0}
              />
            </div>
          )}
        </div>
      </main>

      {/* Result Overlay */}
      {timer === 0 && biddingEndTime && hasBid && showResult && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            {mostRecentHighestBid && highestBidder ? (
              <>
                <h2 className="text-3xl font-bold mb-4">Property Sold!</h2>
                <p className="text-xl mb-2">{highestBidder.name} bought this property for €{mostRecentHighestBid.amount.toLocaleString()}!</p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-4">No Bids!</h2>
                <p className="text-xl mb-2">No one bought this property.</p>
              </>
            )}
            <p className="text-lg mt-4">Next property in {resultCountdown} seconds...</p>
          </div>
        </div>
      )}
    </div>
  );
}