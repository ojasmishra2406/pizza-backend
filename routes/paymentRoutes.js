import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All payment routes require authentication
router.post('/create', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failure', protect, handlePaymentFailure);

export default router;
