import express from 'express';
import Payment from '../models/Payment.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

// Get all payments
router.get('/payments', authMiddleware.protect, adminOnly, async (req, res) => {
    try {
        const payments = await Payment.find().populate('user', 'name email');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
