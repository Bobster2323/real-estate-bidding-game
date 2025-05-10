export interface BankIntervention {
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
    challenge: "One Full Shot. No Excuses. 🥃",
    description: "Your portfolio requires immediate liquid intervention. Take a shot, courtesy of Booze Bank LTD.",
    bankStatement: "The market has reviewed your past performance... and lost all confidence. Booze Bank LTD is, quite frankly, shocked.",
    severity: "Your reckless financial decisions have led to this moment. The severity of this intervention directly correlates with your consistently poor judgment.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    challenge: "Finish One Beer. Slowly. 🍺",
    description: "Time to face the consequences of your financial decisions. Finish a beer for Booze Bank LTD.",
    bankStatement: "Your credit score has reached levels that make even junior analysts at Booze Bank LTD uncomfortable. The board has serious concerns.",
    severity: "Consider this a formal warning. Your portfolio's performance suggests a concerning pattern of high-risk behavior.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    challenge: "Two Shots. Back to Back. 🥃🥃",
    description: "Double trouble for double mistakes. Take two shots immediately for Booze Bank LTD.",
    bankStatement: "Your actions have become a cautionary tale. The market is watching. Booze Bank LTD is disappointed.",
    severity: "This is a moment of public shame. Let everyone learn from your mistakes.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    challenge: "Chug Half a Beer. No Breaks. 🍺",
    description: "A swift penalty for a swift decline. Chug half a beer now for Booze Bank LTD.",
    bankStatement: "Your repeated errors have forced Booze Bank LTD to take drastic measures.",
    severity: "This is a remedial intervention. The board is losing patience.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    challenge: "Mix a 'Banker's Special' (everyone picks an ingredient) and drink it. 🍹",
    description: "A custom drink for a custom disaster. Enjoy your creation, courtesy of Booze Bank LTD.",
    bankStatement: "Your performance has set a new low. Booze Bank LTD insists on a unique penalty.",
    severity: "Let this drink be a warning to others.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    challenge: "Take a Shot Decided by the Group 🥃🤔",
    description: "You have lost the right to choose. The group will determine your shot for Booze Bank LTD.",
    bankStatement: "Your financial recklessness has left Booze Bank LTD speechless.",
    severity: "This is the ultimate intervention. May your peers show mercy.",
    difficulty: 'hard',
    type: 'penalty'
  },
  {
    challenge: "Half a Beer. No Complaints. 🍺",
    description: "A measured response to your measurable decline. Drink half a beer for Booze Bank LTD.",
    bankStatement: "The risk assessment department at Booze Bank LTD has flagged your account for immediate intervention. Your credit score is... suboptimal.",
    severity: "This intervention reflects the board's growing concern with your investment strategy.",
    difficulty: 'medium',
    type: 'penalty'
  },
  // New unique penalty interventions
  {
    challenge: "Two Push-Ups. Right Now. 💪",
    description: "Physical activity may help you rethink your financial strategy.",
    bankStatement: "Your portfolio's performance has been sluggish. The board recommends immediate action.",
    severity: "This is a wake-up call. The board expects better results.",
    difficulty: 'medium',
    type: 'penalty'
  },
  {
    challenge: "Sing a Song of Regret 🎤",
    description: "A public display of remorse is required.",
    bankStatement: "Your credit score has hit a sour note. Time to face the music.",
    severity: "Let this be a lesson in humility and risk management.",
    difficulty: 'medium',
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
    challenge: "Champagne Toast 🍾",
    description: "Booze Bank LTD wishes to acknowledge your exemplary performance. Raise a glass!",
    bankStatement: "The board at Booze Bank LTD is pleased to announce that your credit score has exceeded all expectations. This calls for a moment of recognition.",
    severity: "This is not an intervention, but rather a celebration of financial excellence. Booze Bank LTD rarely extends such invitations.",
    difficulty: 'easy',
    type: 'celebration'
  },
  {
    challenge: "Premium Whiskey Tasting 🥃",
    description: "A small token of Booze Bank LTD's appreciation. Take a sip of something special!",
    bankStatement: "Your investment strategy has demonstrated remarkable stability and foresight. The board at Booze Bank LTD is impressed.",
    severity: "Consider this an informal gathering of successful individuals. Your presence honors Booze Bank LTD.",
    difficulty: 'easy',
    type: 'celebration'
  },
  // New unique celebration interventions
  {
    challenge: "Victory Dance 💃🕺",
    description: "Celebrate your financial acumen with a dance.",
    bankStatement: "Your credit score is the envy of the market. Time to show off your moves.",
    severity: "The board is delighted. Enjoy this moment of glory.",
    difficulty: 'easy',
    type: 'celebration'
  },
  {
    challenge: "Share a Compliment 🗣️",
    description: "Spread positivity as a reward for your success.",
    bankStatement: "Your positive performance uplifts the entire market.",
    severity: "The board encourages you to inspire others.",
    difficulty: 'easy',
    type: 'celebration'
  }
];

// Regular interventions for normal situations
const regularInterventions: BankIntervention[] = [
  {
    challenge: "Sip of Beer 🍺",
    description: "A minor course correction is required. Take a sip for Booze Bank LTD.",
    bankStatement: "Recent market analysis at Booze Bank LTD suggests a need for minor portfolio adjustments. Nothing serious... yet.",
    severity: "This intervention is merely precautionary. The board at Booze Bank LTD expects full compliance.",
    difficulty: 'easy',
    type: 'penalty'
  },
  {
    challenge: "Half a Shot 🥃",
    description: "Standard risk management procedure. Take half a shot for Booze Bank LTD.",
    bankStatement: "Your credit score has shown concerning fluctuations. Booze Bank LTD requires immediate attention to this matter.",
    severity: "Consider this a gentle reminder of Booze Bank LTD's liquidity requirements.",
    difficulty: 'medium',
    type: 'penalty'
  },
  // New unique regular interventions
  {
    challenge: "Tell a Finance Joke 😂",
    description: "Lighten the mood and reflect on your strategy.",
    bankStatement: "The board senses tension. A little humor may help.",
    severity: "This is a minor intervention. Keep your spirits up.",
    difficulty: 'easy',
    type: 'penalty'
  },
  {
    challenge: "Take a Deep Breath 🧘‍♂️",
    description: "Pause and reconsider your next move.",
    bankStatement: "The market is volatile. Stay calm and carry on.",
    severity: "A gentle nudge to maintain composure.",
    difficulty: 'easy',
    type: 'penalty'
  }
];

// Special celebration for first loan
export const firstLoanCelebrationIntervention: BankIntervention = {
  challenge: "Cheers! 🍻",
  description: "We are so happy to have you as a client at Booze Bank LTD. Let's cheers and take a couple sips!",
  bankStatement: "Welcome to Booze Bank LTD! Your first loan marks the beginning of a prosperous (and boozy) partnership.",
  severity: "This is a moment to celebrate your new financial journey with Booze Bank LTD.",
  difficulty: 'easy',
  type: 'celebration'
}

export function getRandomIntervention(creditScore: number, needsLoan: boolean): BankIntervention | null {
  // Credit score ranges
  const BAD_CREDIT = 600;
  const GOOD_CREDIT = 700;
  
  // If they don't need a loan and have good credit, no intervention needed
  if (!needsLoan && creditScore >= BAD_CREDIT) {
    return null;
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
    // 50% chance if they need a loan with normal credit
    interventionChance = 0.5;
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