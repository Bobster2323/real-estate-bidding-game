export interface BankIntervention {
  id: string;
  challenge: string;
  description: string;
  bankStatement: string;
  severity: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'penalty' | 'celebration';
}

// Penalty interventions for bad credit scores
const penaltyInterventions: BankIntervention[] = [
  {
    id: 'one-shot-no-excuses',
    challenge: "One Shot. No Excuses. 🥃",
    description: "Take a shot for Booze Bank LTD.",
    bankStatement: "Your performance worries Booze Bank LTD.",
    severity: "This is a direct result of risky choices.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    id: 'finish-a-beer',
    challenge: "Finish a Beer. 🍺",
    description: "Finish a beer for Booze Bank LTD.",
    bankStatement: "Your credit score is making us nervous.",
    severity: "This is a warning for risky behavior.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    id: 'two-shots-now',
    challenge: "Two Shots. Now. 🥃🥃",
    description: "Take two shots for Booze Bank LTD.",
    bankStatement: "You're now a cautionary tale.",
    severity: "Let others learn from your mistakes.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    id: 'chug-half-beer',
    challenge: "Chug Half a Beer. 🍺",
    description: "Chug half a beer for Booze Bank LTD.",
    bankStatement: "We're forced to act.",
    severity: "The board is losing patience.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    id: 'bankers-special-group-drink',
    challenge: "Banker's Special: Group Drink 🍹",
    description: "Drink a mix chosen by everyone.",
    bankStatement: "You've set a new low.",
    severity: "Let this be a warning.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    id: 'groups-choice-shot',
    challenge: "Group's Choice Shot 🥃🤔",
    description: "Group picks your shot.",
    bankStatement: "We're speechless.",
    severity: "May your peers be kind.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    id: 'half-a-beer',
    challenge: "Half a Beer. 🍺",
    description: "Drink half a beer.",
    bankStatement: "Immediate intervention required.",
    severity: "We're concerned about your strategy.",
    difficulty: 'medium',
    type: 'penalty'
  },
  {
    id: 'two-pushups',
    challenge: "Two Push-Ups 💪",
    description: "Do two push-ups.",
    bankStatement: "Your portfolio is sluggish.",
    severity: "Time to step up.",
    difficulty: 'medium',
    type: 'penalty'
  },
  {
    id: 'sing-regret-song',
    challenge: "Sing a Regret Song 🎤",
    description: "Sing a song of regret.",
    bankStatement: "Your score hit a sour note.",
    severity: "A lesson in humility.",
    difficulty: 'medium',
    type: 'penalty'
  },
  {
    id: 'choose-loan-guarantor',
    challenge: "Choose a Loan Guarantor 🧑‍🤝‍🧑",
    description: "Pick someone to back your loan—they must take a shot for you.",
    bankStatement: "Your credit is so shaky, Booze Bank LTD demands a guarantor. Someone else must share your risk.",
    severity: "Find a friend willing to vouch for you—with a shot.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    id: 'guarantor-group-vote',
    challenge: "Guarantor by Group Vote 🗳️",
    description: "The group votes for your loan guarantor. That person must take a shot for you.",
    bankStatement: "Booze Bank LTD has lost trust. The group must decide who will guarantee your loan—with a shot.",
    severity: "Your fate is in the hands of your peers.",
    difficulty: 'hard',
    type: 'penalty'
  }
];

// Special high-severity penalty for negative balance (now randomizes from hard drink penalties)
function getRandomHardDrinkPenalty(): BankIntervention {
  const hardPenalties = penaltyInterventions.filter(p => p.difficulty === 'hard');
  return hardPenalties[Math.floor(Math.random() * hardPenalties.length)];
}

// Celebration interventions for good credit scores
const celebrationInterventions: BankIntervention[] = [
  {
    id: 'champagne-toast',
    challenge: "Champagne Toast 🍾",
    description: "Raise a glass!",
    bankStatement: "Your score is outstanding.",
    severity: "A rare celebration from Booze Bank LTD.",
    difficulty: 'easy',
    type: 'celebration'
  },
  {
    id: 'whiskey-tasting',
    challenge: "Whiskey Tasting 🥃",
    description: "Sip something special.",
    bankStatement: "Your strategy impresses us.",
    severity: "You're among the best.",
    difficulty: 'easy',
    type: 'celebration'
  },
  {
    id: 'victory-dance',
    challenge: "Victory Dance 💃🕺",
    description: "Show off your moves.",
    bankStatement: "You're the envy of the market.",
    severity: "Enjoy your glory.",
    difficulty: 'easy',
    type: 'celebration'
  },
  {
    id: 'share-compliment',
    challenge: "Share a Compliment 🗣️",
    description: "Give someone a compliment.",
    bankStatement: "Your positivity lifts the market.",
    severity: "Inspire others.",
    difficulty: 'easy',
    type: 'celebration'
  },
  {
    id: 'share-the-wealth',
    challenge: "Share the Wealth! 🥂",
    description: "Your credit score is stellar! Pick another player to take two sips in your honor.",
    bankStatement: "Booze Bank LTD is amazed by your financial acumen. Time to spread the good fortune.",
    severity: "Outstanding performance deserves a toast—by someone else!",
    difficulty: 'easy',
    type: 'celebration'
  },
  {
    id: 'toast-to-success',
    challenge: "Toast to Success 🍻",
    description: "Choose a player to celebrate your achievement by taking two sips.",
    bankStatement: "Your portfolio is the envy of the market. Let others join in your celebration.",
    severity: "Your success is contagious—let someone else drink to it.",
    difficulty: 'easy',
    type: 'celebration'
  },
  {
    id: 'generous-banker',
    challenge: "Generous Banker 🎉",
    description: "Pick a player to enjoy two sips, courtesy of your excellent credit.",
    bankStatement: "Booze Bank LTD rewards generosity. Share your good fortune.",
    severity: "A reward for you, a drink for them.",
    difficulty: 'easy',
    type: 'celebration'
  }
];

// Regular interventions for normal situations
const regularInterventions: BankIntervention[] = [
  {
    id: 'sip-of-beer',
    challenge: "Sip of Beer 🍺",
    description: "Take a sip.",
    bankStatement: "Minor adjustment needed.",
    severity: "Just a precaution.",
    difficulty: 'easy',
    type: 'penalty'
  },
  {
    id: 'half-a-shot',
    challenge: "Half a Shot 🥃",
    description: "Take half a shot.",
    bankStatement: "Your score is fluctuating.",
    severity: "A gentle reminder.",
    difficulty: 'medium',
    type: 'penalty'
  },
  {
    id: 'finance-joke',
    challenge: "Tell a Finance Joke 😂",
    description: "Tell a finance joke.",
    bankStatement: "Lighten the mood.",
    severity: "Keep spirits up.",
    difficulty: 'easy',
    type: 'penalty'
  },
  {
    id: 'deep-breath',
    challenge: "Take a Deep Breath 🧘‍♂️",
    description: "Pause and breathe.",
    bankStatement: "Stay calm.",
    severity: "Maintain composure.",
    difficulty: 'easy',
    type: 'penalty'
  }
];

// Special celebration for first loan
export const firstLoanCelebrationIntervention: BankIntervention = {
  id: 'first-loan-cheers',
  challenge: "Cheers! 🍻",
  description: "Cheers and take a sip!",
  bankStatement: "Welcome to Booze Bank LTD!",
  severity: "Celebrate your new journey.",
  difficulty: 'easy',
  type: 'celebration'
}

export function getRandomIntervention(creditScore: number, needsLoan: boolean): BankIntervention | null {
  // Credit score ranges
  const BAD_CREDIT = 600;
  const GOOD_CREDIT = 700;
  const OUTSTANDING_CREDIT = 750;
  
  // If they don't need a loan and have good credit, no intervention needed
  if (!needsLoan && creditScore >= BAD_CREDIT) {
    return null;
  }
  
  // Outstanding client: credit score 750 or higher
  if (creditScore >= OUTSTANDING_CREDIT) {
    // Only use the new outstanding celebration interventions
    const outstandingCelebrations = celebrationInterventions.filter(
      i => ['share-the-wealth', 'toast-to-success', 'generous-banker'].includes(i.id)
    );
    return outstandingCelebrations[Math.floor(Math.random() * outstandingCelebrations.length)];
  }
  
  // Intervention probability based on credit score
  let interventionChance = 0; // No base chance anymore
  
  if (creditScore < BAD_CREDIT) {
    // Up to 80% chance for bad credit
    interventionChance = 0.8;
  } else if (creditScore > GOOD_CREDIT && needsLoan) {
    // 20% chance for celebration when taking a loan with good credit
    interventionChance = 0.2;
  } else if (needsLoan) {
    // 10% chance for regular intervention when taking a loan with average credit
    interventionChance = 0.1;
  }

  if (Math.random() > interventionChance) {
    return null;
  }

  // Select intervention type based on credit score
  let interventions: BankIntervention[];
  if (creditScore > GOOD_CREDIT && needsLoan) {
    interventions = celebrationInterventions;
  } else if (creditScore < BAD_CREDIT) {
    interventions = penaltyInterventions;
  } else {
    interventions = regularInterventions;
  }

  const randomIndex = Math.floor(Math.random() * interventions.length);
  return interventions[randomIndex];
}

function getRandomPenaltyByDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
  const filtered = penaltyInterventions.filter(p => p.difficulty === difficulty);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getInterventionForBid(creditScore: number, needsLoan: boolean, balance: number): BankIntervention | null {
  // Always trigger a random hard drink penalty if negative balance and trying to bid
  if (balance < 0 && needsLoan) {
    return getRandomHardDrinkPenalty();
  }
  // Severity-based logic for penalties
  if (creditScore <= 700 && creditScore > 650) {
    return getRandomPenaltyByDifficulty('easy');
  }
  if (creditScore <= 650 && creditScore > 600) {
    return getRandomPenaltyByDifficulty('medium');
  }
  if (creditScore <= 600) {
    return getRandomPenaltyByDifficulty('hard');
  }
  // Use the original logic otherwise (celebration, regular, or no intervention)
  return getRandomIntervention(creditScore, needsLoan);
}

function getRandomInterventionByDifficultyAndType(
  interventions: BankIntervention[],
  difficulty: 'easy' | 'medium' | 'hard',
  type?: 'penalty' | 'celebration',
  lastInterventionId?: string
): BankIntervention {
  let filtered = interventions.filter(i => i.difficulty === difficulty);
  if (type) {
    filtered = filtered.filter(i => i.type === type);
  }
  // Exclude the last intervention if possible
  if (lastInterventionId && filtered.length > 1) {
    filtered = filtered.filter(i => i.id !== lastInterventionId);
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Example usage:
// getRandomInterventionByDifficultyAndType(penaltyInterventions, 'hard');
// getRandomInterventionByDifficultyAndType(celebrationInterventions, 'easy', 'celebration'); 

function handleInvestment(playerId: string, investmentAmount: number) {
  // Find player
  const player = players.find(p => p.id === playerId);
  if (!player) return;

  // Update balance
  player.balance += investmentAmount;
  player.creditScore = calculateCreditScore(player.balance);

  // Update state/context to trigger re-render
  setPlayers([...players]);
}

function calculateCreditScore(balance: number): number {
  if (balance < -1000000) return 500; // Catastrophic
  if (balance < 0) return 600;        // Bad
  if (balance < 100000) return 700;   // Average
  if (balance < 200000) return 750;   // Good
  return 850;                         // Excellent
}

export async function fetchRandomProperties(count: number): Promise<Omit<Listing, "id">[]> {
  try {
    const response = await fetch(`${RENTCAST_API_URL}/listings/sale?limit=${count}`, {
      headers: {
        "X-Api-Key": RENTCAST_API_KEY,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`RentCast API error: ${response.statusText}`);
    }

    const data = await response.json();
    const listings = Array.isArray(data) ? data : data.listings || [];

    return listings.map((property: any) => ({
      title: property.formattedAddress || `${property.addressLine1}, ${property.city}, ${property.state}`,
      area: `${property.city}, ${property.state}`,
      size: `${property.squareFootage || "?"} sqft`,
      rooms: `${property.bedrooms || "?"} beds, ${property.bathrooms || "?"} baths`,
      images: property.photos?.map((photo: any) => photo.url) || [],
      realPrice: property.price || 0,
      agentId: "",
    }));
  } catch (error) {
    console.error("Error fetching properties from RentCast:", error);
    throw error;
  }
} 