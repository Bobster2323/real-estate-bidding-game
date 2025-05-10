import { useCredit } from "@/context/credit-context"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CreditScoreProps {
  playerId: string
}

export function CreditScore({ playerId }: CreditScoreProps) {
  const { getCreditScore, getInterestRate, creditHistory } = useCredit()
  
  const score = getCreditScore(playerId)
  const rate = getInterestRate(playerId)
  const history = creditHistory(playerId)
  const lastChange = history[history.length - 1]

  // Determine credit rating and color
  const getCreditRating = (score: number) => {
    if (score >= 800) return { rating: "Excellent", color: "text-green-500" }
    if (score >= 700) return { rating: "Good", color: "text-emerald-500" }
    if (score >= 600) return { rating: "Fair", color: "text-yellow-500" }
    if (score >= 500) return { rating: "Poor", color: "text-orange-500" }
    return { rating: "Bad", color: "text-red-500" }
  }

  const { rating, color } = getCreditRating(score)

  // Calculate progress percentage (300-850 range)
  const progressPercentage = ((score - 300) / (850 - 300)) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium">Credit Score</div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${color}`}>{score}</span>
            <Badge variant="outline" className={color}>{rating}</Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">Loan Rate</div>
          <div className="text-2xl font-bold">{(rate * 100).toFixed(1)}%</div>
        </div>
      </div>

      <Progress value={progressPercentage} className="h-2" />
      
      {lastChange && lastChange.change !== 0 && (
        <div className="text-sm text-muted-foreground">
          Last change: <span className={lastChange.change > 0 ? "text-green-500" : "text-red-500"}>
            {lastChange.change > 0 ? "+" : ""}{lastChange.change}
          </span>
          <span className="ml-1">({lastChange.reason})</span>
        </div>
      )}
    </div>
  )
} 