import { Request, Response } from "express";
import { generateSquadVirtualAccount } from "../services/squadService";
import { supabase } from "../config/supabase";
import { calculatePredictiveTrustScore } from "../services/aiScoringService";
import { runNeuralNetworkScoring } from "../services/mlScoringService";

export const createVirtualAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { firstName, lastName, bvn, phoneNumber, dob, address, gender } =
      req.body;

    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !dob ||
      !address ||
      !gender
    ) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // 1. Check if user already exists in Supabase to prevent duplicates
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("phone_number", phoneNumber)
      .single();

    if (existingUser) {
      res
        .status(409)
        .json({ error: "User already exists with this phone number" });
      return;
    }

    // 2. Call the Squad API to generate the virtual bank account
    const squadAccountDetails = await generateSquadVirtualAccount({
      firstName,
      lastName,
      phoneNumber,
      bvn,
      dob,
      address,
      gender,
    });

    // 3. Save the new user and their Squad account to Supabase permanently
    const { data: newUser, error: dbError } = await supabase
      .from("users")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          bvn: bvn || null,
          virtual_account_number: squadAccountDetails.virtual_account_number, // Extracting the account number from Squad's response
        },
      ])
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    res.status(201).json({
      message: "Emergency wallet created successfully",
      user: newUser,
      squad_details: squadAccountDetails,
    });
  } catch (error: any) {
    console.error("Error creating virtual account:", error.message);
    res
      .status(500)
      .json({ error: error.message || "Failed to create emergency wallet" });
  }
};

// New Controller Method: Evaluate Trust Score
export const evaluateUserScore = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Fetch user and their transactions from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId);

    if (userError || !user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Calculate the new score based on data
    const newScore = calculatePredictiveTrustScore(
      transactions || [],
      user.current_balance,
      user.created_at,
    );

    // Update the score in the database
    await supabase
      .from("users")
      .update({ trust_score: newScore })
      .eq("id", userId);

    res.status(200).json({
      message: "Trust score evaluated",
      previous_score: user.trust_score,
      new_score: newScore,
      eligible_for_emergency_funds: newScore >= 70, // Threshold logic
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to evaluate score" });
  }
};

export const simulateDeposit = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      res.status(400).json({ error: "Missing data" });
      return;
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (!user) throw new Error("User not found");

    const newBalance = Number(user.balance) + Number(amount);

    // Insert transaction
    await supabase
      .from("transactions")
      .insert([{ user_id: userId, amount, transaction_type: "deposit" }]);

    // Fetch updated ledger to feed the AI
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId);

    // Run Predictive ML Logic
    // Replace the old AI calculation with the Neural Network
    // (Assuming daysActive is 10 for the hackathon demo)
    const totalDeposits = transactions
      ? transactions.reduce(
          (sum, tx) =>
            sum + (tx.transaction_type === "deposit" ? Number(tx.amount) : 0),
          0,
        )
      : 0;

    const newScore = runNeuralNetworkScoring(totalDeposits, newBalance, 10);
    // Update User Profile
    await supabase
      .from("users")
      .update({ balance: newBalance, trust_score: newScore })
      .eq("id", userId);

    res.status(200).json({
      message: "Deposit simulated",
      new_score: newScore,
      new_balance: newBalance,
      amount_deposited: amount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requestEmergencyFunds = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId, billAmount } = req.body;
    if (!userId || !billAmount) {
      res.status(400).json({ error: "Missing data" });
      return;
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (!user) throw new Error("User not found");

    const MINIMUM_TRUST_SCORE = 60;
    if (user.trust_score < MINIMUM_TRUST_SCORE) {
      res.status(403).json({
        error: `AI Risk Assessment Denied: Trust Score (${user.trust_score}) too low.`,
      });
      return;
    }

    const newBalance = Number(user.balance) - Number(billAmount);

    // Insert Emergency Transaction
    await supabase.from("transactions").insert([
      {
        user_id: userId,
        amount: billAmount,
        transaction_type: "emergency_payout",
      },
    ]);

    // Fetch updated ledger
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId);

    // Run Predictive ML Logic (This will tank the score due to the new debt)
    // Replace the old AI calculation with the Neural Network
    // (Assuming daysActive is 10 for the hackathon demo)
    const totalDeposits = transactions
      ? transactions.reduce(
          (sum, tx) =>
            sum + (tx.transaction_type === "deposit" ? Number(tx.amount) : 0),
          0,
        )
      : 0;

    const newScore = runNeuralNetworkScoring(totalDeposits, newBalance, 10);

    // Update User Profile
    await supabase
      .from("users")
      .update({ balance: newBalance, trust_score: newScore })
      .eq("id", userId);

    res.status(200).json({
      message: "Emergency Funds Approved!",
      details: `₦${billAmount.toLocaleString()} routed via Squad.`,
      new_balance: newBalance,
      new_score: newScore, // Sending the recalculated score back to the frontend
      approved: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
