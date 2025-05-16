"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function BankDashboard() {
  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<any>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  const [tab, setTab] = useState<"investors" | "rankings">("investors");
  const [allBanks, setAllBanks] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Get player profile
      const { data: player } = await supabase.from("players").select("*", { count: "exact" }).eq("user_id", user.id).single();
      if (!player || !player.investment_bank_id) return;
      // Get bank info
      const { data: bankData } = await supabase.from("investment_bank").select("*").eq("id", player.investment_bank_id).single();
      setBank(bankData);
      // Get all investors in this bank
      const { data: investorList } = await supabase.from("players").select("*").eq("investment_bank_id", player.investment_bank_id);
      setInvestors(investorList || []);
      // Get all banks for rankings
      const { data: banksList } = await supabase.from("investment_bank").select("*");
      setAllBanks(banksList || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <RequireAuth><div className="p-12 text-center text-lg">Loading dashboard...</div></RequireAuth>;
  if (!bank) return <RequireAuth><div className="p-12 text-center text-lg">No bank found for your profile.</div></RequireAuth>;

  const totalCapital = bank.balance || 0;
  const roi = 8.7; // Placeholder, replace with real data if available

  async function handleGoToAuction() {
    // 1. Check for a waiting game
    const { data: waitingGames, error } = await supabase
      .from("games")
      .select("id, status")
      .eq("status", "waiting");
    if (error) {
      alert("Error checking for open games");
      return;
    }
    let gameId;
    if (waitingGames && waitingGames.length > 0) {
      gameId = waitingGames[0].id;
    } else {
      // 2. No waiting game, create a new one
      const { data: newGame, error: createError } = await supabase
        .from("games")
        .insert({ status: "waiting" })
        .select()
        .single();
      if (createError || !newGame) {
        alert("Error creating new game");
        return;
      }
      gameId = newGame.id;
    }
    // 3. Update the current user's player row to set game_id
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("players").update({ game_id: gameId }).eq("user_id", user.id);
      // Fetch the updated player row and store its id in localStorage
      const { data: playerRow } = await supabase.from("players").select("id").eq("user_id", user.id).single();
      if (playerRow && playerRow.id) {
        localStorage.setItem("supabasePlayerId", playerRow.id);
      }
    }
    // 4. Redirect to the lobby
    router.push(`/lobby/${gameId}`);
  }

  return (
    <RequireAuth>
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{bank.name}</h1>
            <div className="text-muted-foreground">Investment Bank Dashboard</div>
          </div>
          <button
            className="px-6 py-2 rounded-lg font-semibold text-white shadow bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 transition"
            onClick={handleGoToAuction}
          >
            Go to Auction
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card rounded-xl p-6 shadow flex flex-col gap-2">
            <div className="text-muted-foreground text-sm">Total Capital</div>
            <div className="text-2xl font-bold">€{totalCapital.toLocaleString()}</div>
            <div className="text-green-600 text-sm font-semibold flex items-center gap-1">↗ {roi}% ROI</div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow flex flex-col gap-2">
            <div className="text-muted-foreground text-sm">Total Investors</div>
            <div className="text-2xl font-bold">{investors.length}</div>
          </div>
        </div>
        <div className="flex gap-4 mb-6">
          <Button variant={tab === "investors" ? "default" : "outline"} onClick={() => setTab("investors")}>Investors</Button>
          <Button variant={tab === "rankings" ? "default" : "outline"} onClick={() => setTab("rankings")}>Bank Rankings</Button>
        </div>
        {tab === "investors" && (
          <div className="bg-card rounded-xl p-6 shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Investors</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 font-semibold">Investor</th>
                    <th className="py-2 px-4 font-semibold">Invested Amount</th>
                    <th className="py-2 px-4 font-semibold">ROI</th>
                    <th className="py-2 px-4 font-semibold">Deals</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-b-0">
                      <td className="py-2 px-4 font-medium">{inv.name}</td>
                      <td className="py-2 px-4">€{(inv.invested_amount || 0).toLocaleString()}</td>
                      <td className="py-2 px-4 text-green-600">{inv.roi ? `${inv.roi}%` : "8.7%"}</td>
                      <td className="py-2 px-4">{inv.deals || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "rankings" && (
          <div className="bg-card rounded-xl p-6 shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Bank Rankings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 font-semibold">Bank</th>
                    <th className="py-2 px-4 font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {allBanks.sort((a, b) => (b.balance || 0) - (a.balance || 0)).map((b) => (
                    <tr key={b.id} className="border-b last:border-b-0">
                      <td className="py-2 px-4 font-medium">{b.name}</td>
                      <td className="py-2 px-4">€{(b.balance || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
} 