import { Router } from 'express';
import { createVirtualAccount, evaluateUserScore, requestEmergencyFunds, simulateDeposit,  } from '../controllers/walletController';

const router = Router();

router.post('/create-account', createVirtualAccount);
router.get('/evaluate-score/:userId', evaluateUserScore);

router.post('/simulate-deposit', simulateDeposit); 
router.post('/emergency-payout', requestEmergencyFunds);

export default router;