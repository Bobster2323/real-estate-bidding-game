"use client"

import { usePlayers } from "@/context/players-context"
import { Trophy, TrendingUp, TrendingDown, Crown, Skull } from "lucide-react"

export function Leaderboard() {
  const { players } = usePlayers()

  // Sort players by balance in descending order
  const sortedPlayers = [...players].sort((a, b) => b.balance - a.balance)

  // Find the player with the highest profit/loss
  const highestProfit = Math.max(...players.map(p => p.balance - 1000000))
  const lowestProfit = Math.min(...players.map(p => p.balance - 1000000))

  return (
    <div className="bg-card rounded-xl p-4 shadow-lg border border-border/50">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <div>
          <h2 className="text-xl font-bold">Leaderboard</h2>
          <p className="text-xs text-muted-foreground">Starting balance: €1,000,000</p>
        </div>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const profit = player.balance - 1000000
          const isHighest = profit === highestProfit
          const isLowest = profit === lowestProfit
          const profitPercentage = ((profit / 1000000) * 100).toFixed(1)

          return (
            <div
              key={player.id}
              className={`relative overflow-hidden group ${
                index === 0
                  ? "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5"
                  : index === 1
                  ? "bg-gradient-to-r from-gray-400/20 to-gray-400/5"
                  : index === 2
                  ? "bg-gradient-to-r from-amber-700/20 to-amber-700/5"
                  : "bg-muted/50"
              } rounded-lg p-3 transition-all hover:scale-[1.02] hover:shadow-md`}
            >
              {/* Position indicator */}
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50 opacity-50" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Rank circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base ${
                      index === 0
                        ? "bg-yellow-500 text-yellow-950"
                        : index === 1
                        ? "bg-gray-400 text-gray-950"
                        : index === 2
                        ? "bg-amber-700 text-amber-50"
                        : "bg-muted-foreground/20 text-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Player info */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{player.name}</span>
                      {isHighest && <Crown className="w-4 h-4 text-green-500" />}
                      {isLowest && <Skull className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {profit >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          profit >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {profit >= 0 ? "+" : ""}
                        {profitPercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Balance */}
                <div className="text-right">
                  <div className="font-bold">
                    €{player.balance.toLocaleString()}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      profit >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {profit >= 0 ? "+" : ""}€{Math.abs(profit).toLocaleString()}
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