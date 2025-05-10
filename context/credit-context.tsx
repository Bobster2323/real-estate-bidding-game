"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Constants for credit score calculations
const INITIAL_CREDIT_SCORE = 750
const MAX_CREDIT_SCORE = 850
const MIN_CREDIT_SCORE = 300

// Interest rate ranges based on credit score - More granular and aggressive
const INTEREST_RATES = {
  exceptional: { min: 800, rate: 0.03 }, // 3%
  excellent: { min: 750, rate: 0.045 }, // 4.5%
  good: { min: 700, rate: 0.06 }, // 6%
  fair: { min: 650, rate: 0.08 }, // 8%
  poor: { min: 600, rate: 0.10 }, // 10%
  bad: { min: 500, rate: 0.125 }, // 12.5%
  terrible: { min: 300, rate: 0.15 }, // 15%
}

type CreditScore = {
  playerId: string
  score: number
  history: Array<{
    date: Date
    change: number
    reason: string
  }>
}

type CreditContextType = {
  getCreditScore: (playerId: string) => number
  getInterestRate: (playerId: string) => number
  updateCreditScore: (playerId: string, propertyValue: number, bidAmount: number, profit: number, loanAmount: number) => void
  creditHistory: (playerId: string) => Array<{ date: Date; change: number; reason: string }>
  initializeCredit: (playerId: string) => void
  removeCredit: (playerId: string) => void
}

const CreditContext = createContext<CreditContextType | undefined>(undefined)

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [creditScores, setCreditScores] = useState<CreditScore[]>([])

  // Load credit scores from localStorage on mount
  useEffect(() => {
    const savedScores = localStorage.getItem("realEstateCreditScores")
    if (savedScores) {
      setCreditScores(JSON.parse(savedScores))
    }
  }, [])

  // Save credit scores to localStorage when they change
  useEffect(() => {
    localStorage.setItem("realEstateCreditScores", JSON.stringify(creditScores))
  }, [creditScores])

  const initializeCredit = (playerId: string) => {
    if (!creditScores.find(cs => cs.playerId === playerId)) {
      setCreditScores(prev => [...prev, {
        playerId,
        score: INITIAL_CREDIT_SCORE,
        history: [{
          date: new Date(),
          change: 0,
          reason: "Initial credit score"
        }]
      }])
    }
  }

  const removeCredit = (playerId: string) => {
    setCreditScores(prev => prev.filter(cs => cs.playerId !== playerId))
  }

  const getCreditScore = (playerId: string) => {
    return creditScores.find(cs => cs.playerId === playerId)?.score ?? INITIAL_CREDIT_SCORE
  }

  const getInterestRate = (playerId: string) => {
    const score = getCreditScore(playerId)
    for (const [_, data] of Object.entries(INTEREST_RATES)) {
      if (score >= data.min) {
        return data.rate
      }
    }
    return INTEREST_RATES.terrible.rate
  }

  const PROFIT_SCORE_INCREASE = 100;
  const LOSS_SCORE_DECREASE = -100;

  const updateCreditScore = (playerId: string, propertyValue: number, bidAmount: number, profit: number, loanAmount: number) => {
    let scoreChange = 0;
    let reason = "";

    if (profit > 0) {
      scoreChange = PROFIT_SCORE_INCREASE;
      reason = `Profit on investment`;
    } else if (profit < 0) {
      scoreChange = LOSS_SCORE_DECREASE;
      reason = `Loss on investment`;
    } else {
      scoreChange = 0;
      reason = `No profit or loss`;
    }

    setCreditScores(prev => prev.map(cs => {
      if (cs.playerId === playerId) {
        const finalScoreChange = scoreChange > 0 
          ? Math.round(scoreChange * (1 + Math.max(0, (700 - cs.score) / 700)))
          : Math.round(scoreChange * (Math.min(1, (850 - cs.score) / 150)))
        const newScore = Math.min(MAX_CREDIT_SCORE, Math.max(MIN_CREDIT_SCORE, cs.score + finalScoreChange))
        return {
          ...cs,
          score: newScore,
          history: [...cs.history, {
            date: new Date(),
            change: finalScoreChange,
            reason
          }]
        }
      }
      return cs;
    }))
  }

  const creditHistory = (playerId: string) => {
    return creditScores.find(cs => cs.playerId === playerId)?.history ?? []
  }

  return (
    <CreditContext.Provider value={{
      getCreditScore,
      getInterestRate,
      updateCreditScore,
      creditHistory,
      initializeCredit,
      removeCredit
    }}>
      {children}
    </CreditContext.Provider>
  )
}

export function useCredit() {
  const context = useContext(CreditContext)
  if (context === undefined) {
    throw new Error("useCredit must be used within a CreditProvider")
  }
  return context
} 