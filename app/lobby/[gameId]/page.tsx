"use client"

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGameSession } from "@/context/game-session-context";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import { joinGame, fetchRandomListings, setGameListings, setPlayerReady } from "@/lib/supabaseGame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { RequireAuth } from "@/components/RequireAuth";

export default function LobbyPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { joinSession } = useGameSession();
  const { players } = useRealtimeGame(gameId);
  const [hostName, setHostName] = useState("");
  const [hostAdded, setHostAdded] = useState(false);
  const [rounds, setRounds] = useState(5);
  const [budget, setBudget] = useState(1000000);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerBudgets, setPlayerBudgets] = useState<Record<string, number>>({});

  // Only skip host form if player=1 is in the URL (joiners)
  const isJoiningPlayer = searchParams.get("player") === "1";

  // If host has already joined, remember it
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("supabaseIsHost") === "1") {
      setHostAdded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPlayerId(localStorage.getItem("supabasePlayerId"));
    }
  }, []);

  // Auto-redirect when all players are ready
  useEffect(() => {
    if (players.length > 0 && players.every(p => p.ready)) {
      // Only the host should fetch listings and set them if not already set
      if (localStorage.getItem("supabaseIsHost") === "1") {
        (async () => {
          // Only set listings if not already set
          const { data: game } = await supabase
            .from('games')
            .select('listing_ids')
            .eq('id', gameId)
            .single();
          if (!game?.listing_ids || game.listing_ids.length === 0) {
            const listingIds = await fetchRandomListings(rounds);
            await setGameListings(gameId, listingIds);
          }
          router.push(`/game/${gameId}`);
        })();
      } else {
        router.push(`/game/${gameId}`);
      }
    }
  }, [players, gameId, rounds, router]);

  // Add host as player if not already added
  const handleAddHost = async () => {
    if (!hostName.trim()) {
      setError("Please enter your name");
      return;
    }
    try {
      const player = await joinGame(gameId, hostName);
      localStorage.setItem("supabasePlayerId", player.id);
      localStorage.setItem("supabaseIsHost", "1");
      await joinSession(gameId);
      setHostAdded(true);
    } catch (err) {
      setError("Failed to add host as player");
    }
  };

  // Invite link logic
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${gameId}` : "";
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Update game settings in Supabase (optional: implement this in supabaseGame.ts)
  const handleUpdateSettings = async () => {
    // TODO: Implement updateGameSettings in supabaseGame.ts and call it here
    // await updateGameSettings(gameId, { rounds, budget });
  };

  const handleStartGame = async () => {
    // Fetch N random listing IDs
    const listingIds = await fetchRandomListings(rounds);
    // Save to game in Supabase
    await setGameListings(gameId, listingIds);
    // Redirect to game
    router.push(`/game/${gameId}`);
  };

  // Helper: is this player the host?
  const isHost = players.length > 0 && players[0].id === currentPlayerId;

  // Handle budget change for a player
  const handleBudgetChange = (playerId: string, value: number) => {
    setPlayerBudgets(prev => ({ ...prev, [playerId]: value }));
  };

  // Handle Ready Up: save budget to DB, then set ready, then deduct from bank
  const handleReadyUp = async (playerId: string) => {
    const budget = playerBudgets[playerId] ?? 1000000;
    await supabase.from("players").update({ balance: budget }).eq("id", playerId);
    // Only deduct if not already ready
    const { data: player } = await supabase.from("players").select("*").eq("id", playerId).single();
    if (player && !player.ready && player.investment_bank_id) {
      // Deduct from bank
      const { data: bank } = await supabase.from("investment_bank").select("*").eq("id", player.investment_bank_id).single();
      if (bank) {
        const newBankBalance = (bank.balance || 0) - budget;
        await supabase.from("investment_bank").update({ balance: newBankBalance }).eq("id", bank.id);
      }
    }
    await setPlayerReady(playerId, true);
  };

  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-lg bg-card rounded-lg shadow-lg p-8 space-y-8">
          <h1 className="text-3xl font-bold text-center">Game Lobby</h1>
          {(!isJoiningPlayer && !hostAdded) ? (
            <div className="space-y-4">
              <Input
                placeholder="Enter your name (host)"
                value={hostName}
                onChange={e => setHostName(e.target.value)}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button className="w-full" onClick={handleAddHost}>
                Join as Host
              </Button>
            </div>
          ) : null}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Players in Lobby</h2>
            <ul className="bg-muted rounded-lg p-4 min-h-[40px] flex flex-col gap-2">
              {players.length === 0 && <li className="text-muted-foreground">No players yet</li>}
              {players.map(player => (
                <li key={player.id} className="py-2 px-4 bg-white rounded shadow flex items-center gap-3 border border-gray-200">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {player.name.slice(0,2).toUpperCase()}
                  </div>
                  <span className="text-lg font-medium">{player.name}</span>
                  {player.ready && <span className="ml-2 text-green-600 font-bold">Ready</span>}
                  {player.id === currentPlayerId && !player.ready && (
                    <Button size="sm" className="ml-2" onClick={() => handleReadyUp(player.id)}>Ready Up</Button>
                  )}
                  {/* Individual player budget input */}
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Budget (€)</span>
                    <Input
                      type="number"
                      min={1000}
                      step={1000}
                      value={playerBudgets[player.id] ?? 1000000}
                      onChange={e => handleBudgetChange(player.id, Number(e.target.value))}
                      disabled={player.id !== currentPlayerId || player.ready}
                      className="w-24"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <label className="block font-medium">Number of Rounds</label>
            <Input
              type="number"
              min={1}
              value={rounds}
              onChange={e => setRounds(Number(e.target.value))}
              disabled={!isHost || players.some(p => p.ready)}
            />
            {!isHost && <div className="text-xs text-muted-foreground">Only the host can change the number of rounds.</div>}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
} 