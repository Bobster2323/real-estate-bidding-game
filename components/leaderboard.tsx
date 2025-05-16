"use client"

import { usePlayers } from "@/context/players-context"
import { useCredit } from "@/context/credit-context"
import { Trophy, TrendingUp, TrendingDown } from "lucide-react"

export function Leaderboard({ players: propPlayers, startingBalance: propStartingBalance }: {
  players?: any[];
  startingBalance?: number;
} = {}) {
  const context = usePlayers();
  const { getCreditScore, getInterestRate } = useCredit();
  const players = propPlayers || context.players;
  const startingBalance = propStartingBalance ?? context.startingBalance;

  // Sort players by balance in descending order
  const sortedPlayers = [...players].sort((a, b) => (b.balance || 0) - (a.balance || 0));

  // Determine credit rating and color
  const getCreditRating = (score: number) => {
    if (score >= 800) return { rating: "Excellent", color: "text-green-500" }
    if (score >= 700) return { rating: "Good", color: "text-emerald-500" }
    if (score >= 600) return { rating: "Fair", color: "text-yellow-500" }
    if (score >= 500) return { rating: "Poor", color: "text-orange-500" }
    return { rating: "Bad", color: "text-red-500" }
  }

  return (
    <div className="bg-card rounded-lg p-3 shadow-lg border border-border/50">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Leaderboard</h2>
      </div>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const baseline = typeof player.starting_budget === 'number' && !isNaN(player.starting_budget) ? player.starting_budget : startingBalance;
          const profit = (player.balance || 0) - baseline;
          const profitPercentage = ((profit / baseline) * 100).toFixed(1);
          return (
            <div
              key={player.id}
              className="relative bg-muted/30 rounded-lg transition-all overflow-hidden border border-border/40 shadow-sm hover:shadow-md flex items-center px-3 py-2 gap-3"
            >
              {/* Rank indicator bar */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1 ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-zinc-400" : "bg-bronze-500"}`}
              />
              {/* Rank number */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-medium text-xs border ${
                index === 0 ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" :
                index === 1 ? "bg-zinc-500/10 border-zinc-500/50 text-zinc-500" :
                "bg-bronze-500/10 border-bronze-500/50 text-bronze-500"
              }`}>
                {index + 1}
              </div>
              {/* Player info condensed */}
              <div className="flex-grow flex flex-col justify-center min-w-0">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-semibold text-base truncate max-w-[90px]">{player.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[60px]">({player.investment_bank || "—"})</span>
                </div>
                <div className="flex items-end gap-2 mt-0.5">
                  <span className="text-lg font-bold">€{Math.floor(player.balance || 0).toLocaleString()}</span>
                  <span className={`text-xs font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"} flex items-center gap-1`}>
                    {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {profit >= 0 ? "+" : ""}€{Math.floor(Math.abs(profit)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 