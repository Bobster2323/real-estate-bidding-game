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
  const [tab, setTab] = useState<"investors" | "rankings" | "investorRankings">("investors");
  const [allBanks, setAllBanks] = useState<any[]>([]);
  const [allInvestorStats, setAllInvestorStats] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [allWinningBids, setAllWinningBids] = useState<any[]>([]);
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
      if (!investorList || investorList.length === 0) {
        setInvestors([]);
        setAllBanks([]);
        setAllInvestorStats([]);
        setLoading(false);
        return;
      }
      console.log('investorList', investorList);
      const playerIds = investorList.map((inv: any) => inv.id);
      let winningBids: any[] = [];
      if (playerIds.length === 1) {
        const { data } = await supabase
          .from('bids')
          .select('id, player_id, amount, won, listing_id')
          .eq('won', true)
          .eq('player_id', playerIds[0]);
        winningBids = data || [];
      } else if (playerIds.length > 1) {
        const { data } = await supabase
          .from('bids')
          .select('id, player_id, amount, won, listing_id')
          .eq('won', true)
          .in('player_id', playerIds);
        winningBids = data || [];
      } else {
        winningBids = [];
      }
      // Fetch listing prices in a second query
      const listingIds = Array.from(new Set((winningBids || []).map((bid: any) => bid.listing_id)));
      let listingPriceMap: Record<string, number> = {};
      if (listingIds.length > 0) {
        const { data: listingsData } = await supabase
          .from('listings')
          .select('id, real_price')
          .in('id', listingIds);
        for (const l of listingsData || []) {
          listingPriceMap[l.id] = l.real_price;
        }
      }
      // Attach real_price to each bid
      winningBids = (winningBids || []).map((bid: any) => ({
        ...bid,
        real_price: listingPriceMap[bid.listing_id] || 0
      }));
      console.log('winningBids (with real_price)', winningBids);
      // Aggregate stats per investor
      const investorStats: Record<string, any> = {};
      for (const inv of investorList) {
        investorStats[inv.id] = {
          ...inv,
          invested_amount: 0,
          returned_amount: 0,
          net_profit: 0,
          roi: 0,
          deals: 0,
        };
      }
      for (const bid of (winningBids || []) as any[]) {
        const inv = investorStats[bid.player_id];
        if (inv) {
          inv.invested_amount += bid.amount || 0;
          inv.returned_amount += bid.real_price || 0;
          inv.deals += 1;
        }
      }
      for (const inv of Object.values(investorStats)) {
        (inv as any).net_profit = (inv as any).returned_amount - (inv as any).invested_amount;
        (inv as any).roi = (inv as any).invested_amount > 0 ? (((inv as any).returned_amount - (inv as any).invested_amount) / (inv as any).invested_amount * 100).toFixed(1) : '0.0';
      }
      setInvestors(Object.values(investorStats));
      // Get all banks for rankings
      const { data: banksList } = await supabase.from("investment_bank").select("*");
      setAllBanks(banksList || []);

      // --- Fetch all investors for global ranking ---
      // 1. Get all players
      const { data: allPlayers } = await supabase.from("players").select("*");
      setAllPlayers(allPlayers || []);
      const allPlayerIds = allPlayers ? allPlayers.map((p: any) => p.id) : [];
      let allWinningBids: any[] = [];
      if (allPlayerIds.length === 1) {
        const { data } = await supabase
          .from('bids')
          .select('id, player_id, amount, won, listing_id')
          .eq('won', true)
          .eq('player_id', allPlayerIds[0]);
        allWinningBids = data || [];
      } else if (allPlayerIds.length > 1) {
        const { data } = await supabase
          .from('bids')
          .select('id, player_id, amount, won, listing_id')
          .eq('won', true)
          .in('player_id', allPlayerIds);
        allWinningBids = data || [];
      } else {
        allWinningBids = [];
      }
      // 2. Fetch all relevant listings
      const allListingIds = Array.from(new Set((allWinningBids || []).map((bid: any) => bid.listing_id)));
      let allListingPriceMap: Record<string, number> = {};
      if (allListingIds.length > 0) {
        const { data: listingsData } = await supabase
          .from('listings')
          .select('id, real_price')
          .in('id', allListingIds);
        for (const l of listingsData || []) {
          allListingPriceMap[l.id] = l.real_price;
        }
      }
      // 3. Attach real_price to each bid
      allWinningBids = (allWinningBids || []).map((bid: any) => ({
        ...bid,
        real_price: allListingPriceMap[bid.listing_id] || 0
      }));
      setAllWinningBids(allWinningBids);
      // 4. Aggregate stats per investor
      const allInvestorStatsMap: Record<string, any> = {};
      for (const p of allPlayers || []) {
        allInvestorStatsMap[p.id] = {
          ...p,
          invested_amount: 0,
          returned_amount: 0,
          net_profit: 0,
          roi: 0,
          deals: 0,
        };
      }
      for (const bid of (allWinningBids || []) as any[]) {
        const inv = allInvestorStatsMap[bid.player_id];
        if (inv) {
          inv.invested_amount += bid.amount || 0;
          inv.returned_amount += bid.real_price || 0;
          inv.deals += 1;
        }
      }
      for (const inv of Object.values(allInvestorStatsMap)) {
        (inv as any).net_profit = (inv as any).returned_amount - (inv as any).invested_amount;
        (inv as any).roi = (inv as any).invested_amount > 0 ? (((inv as any).returned_amount - (inv as any).invested_amount) / (inv as any).invested_amount * 100).toFixed(1) : '0.0';
      }
      setAllInvestorStats(Object.values(allInvestorStatsMap));
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <RequireAuth><div className="p-12 text-center text-lg">Loading dashboard...</div></RequireAuth>;
  if (!bank) return <RequireAuth><div className="p-12 text-center text-lg">No bank found for your profile.</div></RequireAuth>;

  const totalCapital = bank.balance || 0;
  const roi = 8.7; // Placeholder, replace with real data if available

  // Calculate bank ranking by balance
  const sortedBanks = [...allBanks].sort((a, b) => (b.balance || 0) - (a.balance || 0));
  const bankRank = sortedBanks.findIndex(b => b.id === bank.id) + 1;
  const totalBanks = allBanks.length;

  // Find best performing investor in this bank
  let bestInvestor = null;
  if (investors.length > 0) {
    bestInvestor = [...investors].sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))[0];
    if (parseFloat(bestInvestor.roi) === 0) bestInvestor = null;
  }

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

  // --- Aggregate bank stats for rankings ---
  const bankStats = (allBanks || []).map((bank: any) => {
    // Get all players in this bank
    const bankPlayers = (allPlayers || []).filter((p: any) => p.investment_bank_id === bank.id);
    const playerIds = bankPlayers.map((p: any) => p.id);
    // Get all winning bids for these players
    const bankBids = (allWinningBids || []).filter((bid: any) => playerIds.includes(bid.player_id));
    const totalInvested = bankBids.reduce((sum: number, bid: any) => sum + (bid.amount || 0), 0);
    const totalReturned = bankBids.reduce((sum: number, bid: any) => sum + (bid.real_price || 0), 0);
    const netProfit = totalReturned - totalInvested;
    const roi = totalInvested > 0 ? ((netProfit / totalInvested) * 100).toFixed(1) : '0.0';
    const deals = bankBids.length;
    return {
      ...bank,
      totalInvestors: bankPlayers.length,
      totalInvested,
      totalReturned,
      netProfit,
      roi,
      deals,
    };
  });

  // Calculate the actual ROI for the current bank
  const thisBankStats = bankStats.find(b => b.id === bank.id);
  const actualROI = thisBankStats && thisBankStats.totalInvested > 0 ? ((thisBankStats.netProfit / thisBankStats.totalInvested) * 100).toFixed(1) : '0.0';

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#18181b]">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-1 text-white drop-shadow-lg">{bank.name}</h1>
              <div className="text-lg text-gray-400 mb-2">Investment Bank Dashboard</div>
            </div>
            <button
              className="px-7 py-3 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:from-green-500 hover:to-green-700 transition text-lg"
              onClick={handleGoToAuction}
            >
              Go to Auction
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-[#23272f] rounded-2xl p-7 shadow-xl flex flex-col gap-2 border border-[#23272f]">
              <div className="text-gray-400 text-base font-medium">Total Capital</div>
              <div className="text-3xl font-bold text-white">€{totalCapital.toLocaleString()}</div>
              <div className="text-green-400 text-base font-semibold flex items-center gap-1">↗ {actualROI}% ROI</div>
          </div>
            <div className="bg-[#23272f] rounded-2xl p-7 shadow-xl flex flex-col gap-2 border border-[#23272f]">
              <div className="text-gray-400 text-base font-medium">Bank Ranking</div>
              <div className="text-3xl font-bold text-white">#{bankRank} <span className='text-lg font-normal text-gray-400'>of {totalBanks}</span></div>
              <div className="text-sm text-gray-400">Ranked by balance</div>
        </div>
            <div className="bg-[#23272f] rounded-2xl p-7 shadow-xl flex flex-col gap-2 border border-[#23272f]">
              <div className="text-gray-400 text-base font-medium">Total Investors</div>
              <div className="text-3xl font-bold text-white">{investors.length}</div>
              <div className="text-sm text-gray-400">6 active, 2 pending</div>
          </div>
            <div className="bg-[#23272f] rounded-2xl p-7 shadow-xl flex flex-col gap-2 border border-[#23272f]">
              <div className="text-gray-400 text-base font-medium">Best Investor</div>
              {bestInvestor ? (
                <>
                  <div className="text-2xl font-bold text-white">{bestInvestor.name}</div>
                  <div className="text-green-400 text-base font-semibold">ROI: {bestInvestor.roi}%</div>
                </>
              ) : (
                <div className="text-lg text-gray-400">No data yet</div>
              )}
          </div>
          </div>
          <div className="flex gap-4 mb-8">
            <Button
              variant="ghost"
              className={`rounded-full px-6 py-2 text-lg font-bold transition-all duration-150
                ${tab === "investors" ? "bg-green-600 text-white shadow-lg" : "bg-transparent text-gray-300 border border-gray-600"}`}
              onClick={() => setTab("investors")}
            >
              Investors
            </Button>
            <Button
              variant="ghost"
              className={`rounded-full px-6 py-2 text-lg font-bold transition-all duration-150
                ${tab === "rankings" ? "bg-green-600 text-white shadow-lg" : "bg-transparent text-gray-300 border border-gray-600"}`}
              onClick={() => setTab("rankings")}
            >
              Bank Rankings
            </Button>
            <Button
              variant="ghost"
              className={`rounded-full px-6 py-2 text-lg font-bold transition-all duration-150
                ${tab === "investorRankings" ? "bg-green-600 text-white shadow-lg" : "bg-transparent text-gray-300 border border-gray-600"}`}
              onClick={() => setTab("investorRankings")}
            >
              Investor Rankings
            </Button>
        </div>
        {tab === "investors" && (
            <div className="bg-[#23272f] rounded-2xl p-8 shadow-xl mb-8 border border-[#23272f]">
              <h2 className="text-2xl font-bold mb-6 text-white">Investors</h2>
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-400">Manage your bank's investors and their performance</div>
                <div className="flex gap-2">
                  <input className="rounded-lg px-4 py-2 bg-[#18181b] text-white placeholder:text-gray-400 border border-[#23272f] focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Search investors..." />
                  <button className="rounded-lg px-3 py-2 bg-[#18181b] text-white border border-[#23272f] hover:bg-[#23272f] transition"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></button>
          </div>
          </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left rounded-xl overflow-hidden border-collapse border border-gray-700">
                  <thead>
                    <tr className="border-b border-[#23272f] bg-[#23272f]/80">
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Investor</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Invested Amount</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Returned Amount</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Net Profit</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">ROI</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Deals</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investors.map((inv, idx) => {
                      const rowBg = idx % 2 === 0 ? 'bg-[#23272f]/70' : '';
                      const isLast = idx === investors.length - 1;
                      return (
                        <tr key={inv.id} className={`${rowBg} ${!isLast ? 'border-b border-gray-600' : ''} hover:bg-[#23272f]/60 transition`}>
                          <td className="py-3 px-5 font-medium text-white border-r border-gray-700">{inv.name}</td>
                          <td className="py-3 px-5 text-white border-r border-gray-700">€{(inv.invested_amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-5 text-white border-r border-gray-700">€{(inv.returned_amount || 0).toLocaleString()}</td>
                          <td className="py-3 px-5 text-white border-r border-gray-700">€{(inv.net_profit || 0).toLocaleString()}</td>
                          <td className="py-3 px-5 font-semibold border-r border-gray-700" style={{ color: parseFloat(inv.roi) >= 0 ? '#4ade80' : '#f87171' }}>{inv.roi}%</td>
                          <td className="py-3 px-5 text-white border-r border-gray-700">{inv.deals || 0}</td>
                          <td className="py-3 px-5"><span className="inline-block rounded-full bg-green-500/20 text-green-400 px-3 py-1 text-xs font-bold">Active</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === "rankings" && (
            <div className="bg-[#23272f] rounded-2xl p-8 shadow-xl mb-8 border border-[#23272f]">
              <h2 className="text-2xl font-bold mb-6 text-white">Bank Rankings</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left rounded-xl overflow-hidden border-collapse border border-gray-700">
                  <thead>
                    <tr className="border-b border-[#23272f] bg-[#23272f]/80">
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Bank</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Balance</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Total Investors</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Total Invested</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Total Returned</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Net Profit</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">ROI</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Deals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankStats
                      .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
                      .map((b, idx) => {
                        const rowBg = idx % 2 === 0 ? 'bg-[#23272f]/70' : '';
                        const isLast = idx === bankStats.length - 1;
                        return (
                          <tr key={b.id} className={`${rowBg} ${!isLast ? 'border-b border-gray-600' : ''} hover:bg-[#23272f]/60 transition`}>
                            <td className="py-3 px-5 font-medium text-white border-r border-gray-700">{b.name}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">€{(b.balance || 0).toLocaleString()}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">{b.totalInvestors}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">€{(b.totalInvested || 0).toLocaleString()}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">€{(b.totalReturned || 0).toLocaleString()}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">€{(b.netProfit || 0).toLocaleString()}</td>
                            <td className="py-3 px-5 font-semibold border-r border-gray-700" style={{ color: parseFloat(b.roi) >= 0 ? '#4ade80' : '#f87171' }}>{b.roi}%</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">{b.deals}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
                </div>
          )}
          {tab === "investorRankings" && (
            <div className="bg-[#23272f] rounded-2xl p-8 shadow-xl mb-8 border border-[#23272f]">
              <h2 className="text-2xl font-bold mb-6 text-white">Investor Rankings (All Time)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left rounded-xl overflow-hidden border-collapse border border-gray-700">
                  <thead>
                    <tr className="border-b border-[#23272f] bg-[#23272f]/80">
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Investor</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Bank</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Invested Amount</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Returned Amount</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Net Profit</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">ROI</th>
                      <th className="py-3 px-5 font-semibold text-white/90 border-r border-b border-gray-700">Deals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allInvestorStats
                      .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
                      .map((inv, idx) => {
                        const bankName = allBanks.find(b => b.id === inv.investment_bank_id)?.name || "-";
                        const rowBg = idx % 2 === 0 ? 'bg-[#23272f]/70' : '';
                        const isLast = idx === allInvestorStats.length - 1;
                        return (
                          <tr key={inv.id} className={`${rowBg} ${!isLast ? 'border-b border-gray-600' : ''} hover:bg-[#23272f]/60 transition`}>
                            <td className="py-3 px-5 font-medium text-white border-r border-gray-700">{inv.name}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">{bankName}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">€{(inv.invested_amount || 0).toLocaleString()}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">€{(inv.returned_amount || 0).toLocaleString()}</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">€{(inv.net_profit || 0).toLocaleString()}</td>
                            <td className="py-3 px-5 font-semibold border-r border-gray-700" style={{ color: parseFloat(inv.roi) >= 0 ? '#4ade80' : '#f87171' }}>{inv.roi}%</td>
                            <td className="py-3 px-5 text-white border-r border-gray-700">{inv.deals || 0}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
      </div>
    </RequireAuth>
  );
} 