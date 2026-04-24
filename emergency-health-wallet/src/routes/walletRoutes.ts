import { Router } from 'express';
import { createVirtualAccount, evaluateUserScore } from '../controllers/walletController';

const router = Router();

router.post('/create-account', createVirtualAccount);
router.get('/evaluate-score/:userId', evaluateUserScore); // New route added

export default router;