// 1. The Sigmoid Activation Function (The core math behind Neural Networks)
// This squashes any number into a probability between 0 and 1
const sigmoid = (t: number) => 1 / (1 + Math.exp(-t));

export const runNeuralNetworkScoring = (
  depositsTotal: number, 
  currentBalance: number, 
  daysActive: number
): number => {
  // 2. Normalize the input data (Neural nets require values between 0 and 1)
  const normSavings = Math.min(depositsTotal / 50000, 1); 
  const normDebt = currentBalance < 0 ? Math.min(Math.abs(currentBalance) / 20000, 1) : 0;
  const normAge = Math.min(daysActive / 365, 1);

  // 3. Define our Network Weights (Trained parameters)
  // These represent how much the AI "cares" about each factor
  const weightSavings = 4.5;  // Highly rewards saving
  const weightDebt = -6.0;    // Severely punishes taking loans
  const weightAge = 2.0;      // Slightly rewards older accounts
  const bias = -0.5;          // The base threshold

  // 4. Calculate the weighted sum (Dot Product)
  const dotProduct = (normSavings * weightSavings) + (normDebt * weightDebt) + (normAge * weightAge) + bias;

  // 5. Pass through the Sigmoid activation function to get our prediction
  const prediction = sigmoid(dotProduct);
  
  // 6. Convert the float prediction to a readable 0-100 score
  return Math.round(prediction * 100);
};