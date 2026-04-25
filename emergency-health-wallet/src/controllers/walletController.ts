import { Request, Response } from 'express';
import { generateSquadVirtualAccount } from '../services/squadService';
import { supabase } from '../config/supabase';
import { calculateDynamicTrustScore } from '../services/aiScoringService';

export const createVirtualAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, bvn, phoneNumber, dob, address, gender } = req.body;

    if (!firstName || !lastName || !phoneNumber || !dob || !address || !gender) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // 1. Check if user already exists in Supabase to prevent duplicates
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUser) {
      res.status(409).json({ error: 'User already exists with this phone number' });
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
        gender
    });

    // 3. Save the new user and their Squad account to Supabase permanently
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          bvn: bvn || null,
          virtual_account_number: squadAccountDetails.virtual_account_number, // Extracting the account number from Squad's response
        }
      ])
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    res.status(201).json({
      message: 'Emergency wallet created successfully',
      user: newUser,
      squad_details: squadAccountDetails
    });

  } catch (error: any) {
    console.error('Error creating virtual account:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create emergency wallet' });
  }
};

// New Controller Method: Evaluate Trust Score
export const evaluateUserScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Fetch user and their transactions from Supabase
    const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
    const { data: transactions, error: txError } = await supabase.from('transactions').select('*').eq('user_id', userId);

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate the new score based on data
    const newScore = calculateDynamicTrustScore(transactions || [], user.created_at);

    // Update the score in the database
    await supabase.from('users').update({ trust_score: newScore }).eq('id', userId);

    res.status(200).json({
      message: 'Trust score evaluated',
      previous_score: user.trust_score,
      new_score: newScore,
      eligible_for_emergency_funds: newScore >= 70 // Threshold logic
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to evaluate score' });
  }
};


export const simulateDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      res.status(400).json({ error: 'Missing userId or amount' });
      return;
    }

    // 1. Insert the deposit record into the transactions table
    const { error: txError } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          amount: amount,
          transaction_type: 'deposit'
        }
      ]);

    if (txError) throw new Error(`Database Error: ${txError.message}`);

    // 2. Fetch the updated transaction history and user creation date
    const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
    const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', userId);

    if (userError || !user) throw new Error('User not found in database');

    // 3. Feed data into the AI Logic to calculate the new score
    const newScore = calculateDynamicTrustScore(transactions || [], user.created_at);

    // 4. Update the user's score in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ trust_score: newScore })
      .eq('id', userId);

    if (updateError) throw new Error('Failed to update trust score');

    // 5. Send the success response back to the mobile app
    res.status(200).json({
      message: 'Deposit simulated successfully',
      new_score: newScore,
      amount_deposited: amount
    });

  } catch (error: any) {
    console.error('Deposit error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process deposit' });
  }
};