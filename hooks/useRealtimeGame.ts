import { useEffect, useState } from "react";
import { subscribeToPlayers, subscribeToBids, placeBid } from "@/lib/supabaseGame";
import { supabase } from "@/lib/supabaseClient";

export function useRealtimeGame(gameId: string) {
  const [players, setPlayers] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);

  // Fetch initial players and bids on mount
  useEffect(() => {
    async function fetchPlayers() {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId);
      setPlayers(data || []);
    }
    async function fetchBids() {
      const { data } = await supabase
        .from('bids')
        .select('*')
        .eq('game_id', gameId);
      setBids(data || []);
    }
    if (gameId) {
      fetchPlayers();
      fetchBids();
    }
  }, [gameId]);

  useEffect(() => {
    const playerSub = subscribeToPlayers(gameId, setPlayers);
    const wrappedSetBids = (bids: any[]) => {
      console.log('[useRealtimeGame] setBids called with:', bids);
      setBids([...(bids || [])]);
    };
    const bidSub = subscribeToBids(gameId, wrappedSetBids);
    return () => {
      console.log('[useRealtimeGame] Cleaning up subscriptions');
      playerSub.unsubscribe();
      bidSub.unsubscribe();
    };
  }, [gameId]);

  // Helper: get latest bid for a player
  const getPlayerBid = (playerId: string) => {
    const playerBids = bids.filter(b => b.player_id === playerId);
    return playerBids.length > 0 ? playerBids[0].amount : 0;
  };

  // Helper: place a bid
  const submitBid = (playerId: string, listingId: string, amount: number) => {
    return placeBid(gameId, playerId, listingId, amount);
  };

  return { players, bids, getPlayerBid, submitBid };
} 