import { Router } from 'express';
import { createVirtualAccount } from '../controllers/walletController';

const router = Router();

// Route to initialize a new user wallet (virtual account)
router.post('/create-account', createVirtualAccount);

export default router;