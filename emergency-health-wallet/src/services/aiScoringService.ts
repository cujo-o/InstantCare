
interface Transaction {
  amount: number;
  transaction_type: string;
  created_at: string;
}

export const calculatePredictiveTrustScore = (
  transactions: Transaction[],
  currentBalance: number,
  accountCreationDate: string,
): number => {
  let baseScore = 50;

  if (!transactions || transactions.length === 0) return baseScore;

  let positiveImpact = 0;
  let negativeImpact = 0;
  const now = new Date().getTime();

  // 1. Time-Weighted Transaction Velocity (Recent deposits mean higher reliability)
  transactions.forEach((tx) => {
    const txDate = new Date(tx.created_at).getTime();
    const daysAgo = Math.max(1, (now - txDate) / (1000 * 3600 * 24));

    // Time decay formula: newer transactions carry more weight
    const weight = 1 / Math.sqrt(daysAgo);

    if (tx.transaction_type === "deposit") {
      positiveImpact += (Number(tx.amount) / 1000) * weight; // 1 point per 1k, weighted
    }
  });

  // 2. Account Maturity Bonus
  const daysActive = Math.floor(
    (now - new Date(accountCreationDate).getTime()) / (1000 * 3600 * 24),
  );
  const maturityBonus = Math.min(15, daysActive * 0.5); // Max 15 points for age

  // 3. Debt-to-Asset Risk Modeling (The ML "Penalty")
  // If the user is overdrawn (negative balance), calculate risk severity
  if (currentBalance < 0) {
    const debtAmount = Math.abs(currentBalance);
    // Exponential penalty based on the size of the loan
    negativeImpact += (debtAmount / 1000) * 2.5;
  } else if (currentBalance > 0) {
    // Reward for maintaining a healthy liquid balance
    positiveImpact += currentBalance / 5000;
  }

  // Calculate final algorithm output
  let finalScore = baseScore + positiveImpact + maturityBonus - negativeImpact;

  // Floor and Ceiling bounds (Score must be between 0 and 100)
  return Math.floor(Math.max(0, Math.min(finalScore, 100)));
};
