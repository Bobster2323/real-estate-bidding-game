"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function GameResultsPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Fetch game
      const { data: gameData } = await supabase.from("games").select("*").eq("id", gameId);
      setGame(gameData && gameData.length > 0 ? gameData[0] : null);

      // Fetch players
      const { data: playerData } = await supabase.from("players").select("*").eq("game_id", gameId);
      setPlayers(playerData || []);

      // Fetch bids
      const { data: bidData } = await supabase.from("bids").select("*").eq("game_id", gameId);
      setBids(bidData || []);

      // Fetch listings
      const { data: listingData } = await supabase.from("listings").select("*");
      setListings(listingData || []);

      setLoading(false);
    }

    fetchData();
  }, [gameId]);

  useEffect(() => {
    async function refundBalances() {
      for (const player of players) {
        if (player.investment_bank_id && typeof player.balance === 'number') {
          // Check if already refunded (optional: add a refunded flag to player row if needed)
          // For now, always refund on results page load
          const { data: bank } = await supabase.from('investment_bank').select('*').eq('id', player.investment_bank_id).single();
          if (bank) {
            const newBankBalance = (bank.balance || 0) + player.balance;
            await supabase.from('investment_bank').update({ balance: newBankBalance }).eq('id', bank.id);
          }
        }
      }
    }
    if (players.length > 0) {
      refundBalances();
    }
  }, [players]);

  // --- Helper calculations ---
  // Only show content when not loading and data is available
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-xl">Loading results…</div>;
  }

  // Calculate stats
  // 1. For each player, calculate properties acquired, total spent, remaining budget, ROI
  const playerStats = players.map(player => {
    // Bids won by this player
    const wonBids = bids.filter(bid => bid.player_id === player.id && bid.won);
    const propertiesAcquired = wonBids.length;
    const totalSpent = wonBids.reduce((sum, bid) => sum + (bid.amount || 0), 0);
    const totalRealValue = wonBids.reduce((sum, bid) => {
      const listing = listings.find(l => l.id === bid.listing_id);
      return sum + (listing?.real_price || 0);
    }, 0);
    const netProfit = totalRealValue - totalSpent;
    const remainingBudget = typeof player.balance === "number" ? player.balance : 0;
    const roi = totalSpent > 0 ? ((totalRealValue - totalSpent) / totalSpent) * 100 : 0;
    return {
      ...player,
      propertiesAcquired,
      totalSpent,
      totalRealValue,
      netProfit,
      remainingBudget,
      roi,
      wonBids
    };
  });

  // Sort by ROI descending, then by totalRealValue descending
  const sortedStats = [...playerStats].sort((a, b) => b.roi - a.roi || b.totalRealValue - a.totalRealValue);

  // Summary cards
  const totalValue = playerStats.reduce((sum, p) => sum + p.totalRealValue, 0);
  const allBids = bids;
  const highestBid = allBids.length > 0 ? allBids.reduce((max, bid) => bid.amount > max.amount ? bid : max, allBids[0]) : null;
  const highestBidAmount = highestBid?.amount || 0;
  const highestBidListing = listings.find(l => l.id === highestBid?.listing_id);
  const topBidder = highestBid ? players.find(p => p.id === highestBid.player_id) : null;
  const highestROIPlayer = sortedStats[0];

  // --- UI ---
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Auction Results</h1>
        <div className="text-muted-foreground text-lg mb-1">Game #{gameId} • {new Date(game?.created_at).toLocaleDateString()}</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white/90 dark:bg-card rounded-xl shadow p-6 flex flex-col items-start">
          <div className="text-xs text-muted-foreground mb-1">Total Value</div>
          <div className="text-2xl font-bold">€{totalValue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">{playerStats.reduce((sum, p) => sum + p.propertiesAcquired, 0)} properties sold</div>
        </div>
        <div className="bg-white/90 dark:bg-card rounded-xl shadow p-6 flex flex-col items-start">
          <div className="text-xs text-muted-foreground mb-1">Highest Bid</div>
          <div className="text-2xl font-bold">€{highestBidAmount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">{highestBidListing?.title || "-"}</div>
        </div>
        <div className="bg-white/90 dark:bg-card rounded-xl shadow p-6 flex flex-col items-start">
          <div className="text-xs text-muted-foreground mb-1">Top Bidder</div>
          <div className="text-2xl font-bold">{topBidder?.name || "-"}</div>
          <div className="text-xs text-muted-foreground mt-1">€{topBidder ? topBidder.totalSpent?.toLocaleString() : "-"} spent</div>
        </div>
        <div className="bg-white/90 dark:bg-card rounded-xl shadow p-6 flex flex-col items-start">
          <div className="text-xs text-muted-foreground mb-1">Highest ROI</div>
          <div className="text-2xl font-bold text-green-600">{highestROIPlayer ? highestROIPlayer.roi.toFixed(1) + "%" : "-"}</div>
          <div className="text-xs text-muted-foreground mt-1">{highestROIPlayer?.name || "-"}</div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white/90 dark:bg-card rounded-xl shadow p-6 mb-10">
        <h2 className="text-xl font-bold mb-4">Final Rankings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 font-semibold">Rank</th>
                <th className="py-2 px-4 font-semibold">Player</th>
                <th className="py-2 px-4 font-semibold">Properties</th>
                <th className="py-2 px-4 font-semibold">Amount Invested</th>
                <th className="py-2 px-4 font-semibold">Amount Returned</th>
                <th className="py-2 px-4 font-semibold">Net Profit</th>
                <th className="py-2 px-4 font-semibold">ROI</th>
                <th className="py-2 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((p, i) => (
                <tr key={p.id} className="border-b hover:bg-gray-100/60 dark:hover:bg-gray-800/40">
                  <td className="py-2 px-4 font-bold">{i + 1}</td>
                  <td className="py-2 px-4">{p.name}</td>
                  <td className="py-2 px-4">{p.propertiesAcquired}</td>
                  <td className="py-2 px-4">€{p.totalSpent.toLocaleString()}</td>
                  <td className="py-2 px-4">€{p.totalRealValue.toLocaleString()}</td>
                  <td className="py-2 px-4">€{p.netProfit.toLocaleString()}</td>
                  <td className="py-2 px-4">{p.totalSpent > 0 ? p.roi.toFixed(1) + '%' : '-'}</td>
                  <td className="py-2 px-4">
                    {i === 0 ? (
                      <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">Winner</span>
                    ) : p.propertiesAcquired > 0 ? (
                      <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-xs">Acquired</span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">No Acquisitions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return to Dashboard Button */}
      <div className="flex justify-end">
        <Button
          onClick={async () => {
            // Mark the game as ended, which will trigger the player reset
            await supabase
              .from('games')
              .update({ status: 'ended' })
              .eq('id', gameId);
            // Reset starting_budget for all players in this game
            await supabase
              .from('players')
              .update({ starting_budget: null })
              .eq('game_id', gameId);
            router.push("/bank/dashboard");
          }}
          className="bg-black text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-gray-900 transition"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
} 