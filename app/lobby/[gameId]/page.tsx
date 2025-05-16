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
  const [allBanks, setAllBanks] = useState<any[]>([]);

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
    await supabase.from("players").update({ balance: budget, starting_budget: budget }).eq("id", playerId);
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

  // Fetch all banks on mount
  useEffect(() => {
    async function fetchBanks() {
      const { data } = await supabase.from("investment_bank").select("*");
      setAllBanks(data || []);
    }
    fetchBanks();
  }, []);

  return (
    <RequireAuth>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#18181b] p-8">
        <div className="w-full max-w-4xl bg-[#23272f] rounded-2xl shadow-2xl p-10 space-y-8 border border-[#23272f]">
          <h1 className="text-3xl font-extrabold text-white text-center mb-2">Game Lobby</h1>
          {(!isJoiningPlayer && !hostAdded) ? (
            <div className="space-y-4">
              <Input
                placeholder="Enter your name (host)"
                value={hostName}
                onChange={e => setHostName(e.target.value)}
                className="bg-[#18181b] text-white border border-gray-700 placeholder:text-gray-400 rounded-lg"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button className="w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-bold rounded-lg shadow-lg" onClick={handleAddHost}>
                Join as Host
              </Button>
            </div>
          ) : null}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Players in Lobby</h2>
            <div className="bg-[#23272f] rounded-xl p-4 border border-gray-700 overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="py-2 px-4 text-gray-400 font-semibold">Player</th>
                    <th className="py-2 px-4 text-gray-400 font-semibold">Bank</th>
                    <th className="py-2 px-4 text-gray-400 font-semibold">Status</th>
                    <th className="py-2 px-4 text-gray-400 font-semibold">Budget (€)</th>
                    <th className="py-2 px-4 text-gray-400 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {players.length === 0 && (
                    <tr><td colSpan={5} className="text-gray-400 py-4 text-center">No players yet</td></tr>
                  )}
                  {players.map(player => {
                    const bank = allBanks.find(b => b.id === player.investment_bank_id);
                    const bankName = bank?.name || "-";
                    const bankBalance = bank?.balance ?? 0;
                    const maxBudget = bankBalance;
                    return (
                      <tr key={player.id} className="border-b border-gray-700">
                        <td className="py-2 px-4 flex items-center gap-2">
                          <span className="text-lg font-semibold text-white">{player.name}</span>
                        </td>
                        <td className="py-2 px-4 text-white">
                          {bankName} <span className="text-xs text-gray-400">(€{bankBalance.toLocaleString()})</span>
                        </td>
                        <td className="py-2 px-4">
                          {player.ready ? <span className="inline-block rounded-full bg-green-500/20 text-green-400 px-3 py-1 text-xs font-bold">Ready</span> : <span className="inline-block rounded-full bg-gray-700 text-gray-300 px-3 py-1 text-xs font-bold">Not Ready</span>}
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*[.,]?[0-9]*"
                            value={
                              (playerBudgets[player.id] ?? 1000000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                            }
                            onChange={e => {
                              let val = e.target.value.replace(/,/g, '');
                              let num = val === '' ? 0 : parseFloat(val);
                              if (num > maxBudget) num = maxBudget;
                              handleBudgetChange(player.id, num);
                            }}
                            disabled={player.id !== currentPlayerId || player.ready}
                            className="w-32 bg-[#23272f] text-white border border-gray-700 rounded-lg text-right appearance-none"
                          />
                        </td>
                        <td className="py-2 px-4">
                          {player.id === currentPlayerId && !player.ready && (
                            <Button size="sm" className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:to-green-700 text-white font-bold rounded shadow" onClick={() => handleReadyUp(player.id)}>Ready Up</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block font-semibold text-white">Number of Rounds</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                className="bg-[#23272f] text-white border border-gray-700 rounded-lg px-3 py-1 disabled:opacity-50"
                onClick={() => setRounds(r => Math.max(1, r - 1))}
                disabled={!isHost || players.some(p => p.ready) || rounds <= 1}
              >
                -
              </Button>
              <span className="w-12 text-center text-lg font-semibold text-white bg-[#23272f] border border-gray-700 rounded-lg py-1">
                {rounds}
              </span>
              <Button
                type="button"
                size="icon"
                className="bg-[#23272f] text-white border border-gray-700 rounded-lg px-3 py-1 disabled:opacity-50"
                onClick={() => setRounds(r => r + 1)}
                disabled={!isHost || players.some(p => p.ready)}
              >
                +
              </Button>
            </div>
            {!isHost && <div className="text-xs text-gray-400">Only the host can change the number of rounds.</div>}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
} 