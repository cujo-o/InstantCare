import { Request, Response } from 'express';
import { generateSquadVirtualAccount } from '../services/squadService';

export const createVirtualAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, bvn, phoneNumber } = req.body;

    // Basic validation
    if (!firstName || !lastName || !phoneNumber) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Call the service to interact with the Squad API
    const accountDetails = await generateSquadVirtualAccount({ 
        firstName, 
        lastName, 
        phoneNumber, 
        bvn 
    });

    res.status(201).json({
      message: 'Emergency wallet created successfully',
      data: accountDetails
    });

  } catch (error: any) {
    console.error('Error creating virtual account:', error.message);
    res.status(500).json({ error: 'Failed to create emergency wallet' });
  }
};