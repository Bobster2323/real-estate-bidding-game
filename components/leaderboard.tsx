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
    <div className="bg-card rounded-xl p-4 shadow-lg border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <div>
          <h2 className="text-xl font-bold">Leaderboard</h2>
          <p className="text-xs text-muted-foreground">Starting balance: €{Math.floor(startingBalance).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedPlayers.map((player, index) => {
          const profit = (player.balance || 0) - startingBalance;
          const profitPercentage = ((profit / startingBalance) * 100).toFixed(1);
          const creditScore = getCreditScore(player.id);
          const { rating, color } = getCreditRating(creditScore);
          const interestRate = getInterestRate(player.id);

          return (
            <div
              key={player.id}
              className="relative bg-muted/30 rounded-xl transition-all overflow-hidden border border-border/50 shadow-sm hover:shadow-md"
            >
              {/* Rank indicator bar */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1 ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-zinc-400" : "bg-bronze-500"}`}
              />

              {/* Main player info */}
              <div className="p-4 flex items-center gap-4">
                {/* Rank number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium border ${
                  index === 0 ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-500" :
                  index === 1 ? "bg-zinc-500/10 border-zinc-500/50 text-zinc-500" :
                  "bg-bronze-500/10 border-bronze-500/50 text-bronze-500"
                }`}>
                  {index + 1}
                </div>

                {/* Player name and balance */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">{player.name}</span>
                    <div className={`text-sm font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"} flex items-center gap-1`}>
                      {profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {profit >= 0 ? "+" : ""}€{Math.floor(Math.abs(profit)).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xl font-bold">€{Math.floor(player.balance || 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Credit info - separated by a subtle border */}
              <div className="border-t border-border/10 bg-black/5 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">Credit Score</div>
                  <div className={`text-sm font-medium ${color}`}>
                    {creditScore}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">Interest Rate</div>
                  <div className="text-sm font-medium">
                    {(interestRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 