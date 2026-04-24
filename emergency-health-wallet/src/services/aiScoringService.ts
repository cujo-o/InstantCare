interface Transaction {
  amount: number;
  transaction_type: string;
  created_at: string;
}

export const calculateDynamicTrustScore = (transactions: Transaction[], accountCreationDate: string): number => {
  let score = 50; // Every user starts with a base score of 50

  if (!transactions || transactions.length === 0) {
    return score; 
  }

  // 1. Analyze deposit consistency
  const deposits = transactions.filter(t => t.transaction_type === 'deposit');
  score += deposits.length * 5; // +5 points for every successful micro-deposit

  // 2. Analyze total volume saved
  const totalSaved = deposits.reduce((sum, t) => sum + Number(t.amount), 0);
  if (totalSaved >= 20000) {
    score += 20; // High saver bonus
  } else if (totalSaved >= 5000) {
    score += 10; // Moderate saver bonus
  }

  // 3. Analyze account maturity (time since creation)
  const daysActive = Math.floor((new Date().getTime() - new Date(accountCreationDate).getTime()) / (1000 * 3600 * 24));
  if (daysActive > 30) score += 10; 
  if (daysActive > 90) score += 15;

  // 4. Penalize for previous emergency defaults (if any logic for this exists later)
  const defaults = transactions.filter(t => t.transaction_type === 'default');
  score -= defaults.length * 30; // Severe penalty for not paying back

  // Cap the score between 0 and 100
  return Math.max(0, Math.min(score, 100));
};