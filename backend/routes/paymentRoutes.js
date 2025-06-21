import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { initiateStkPush } from "../services/mpesaService.js";
// import { createStripePayment } from "../services/stripeService.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import { initiateFlutterwavePayment } from "../services/flutterwaveService.js";
import Subscription from "../models/Subscription.js";

const router = express.Router();

// Subscribe via M-Pesa
router.post("/mpesa", authenticateUser, async (req, res) => {
  try {
    const { phone, amount, plan } = req.body;
    const response = await initiateStkPush(phone, amount);

    if (response.ResponseCode === "0") {
      const newSubscription = new Subscription({
        userId: req.user._id,
        plan,
        paymentMethod: "mpesa",
        transactionId: response.CheckoutRequestID,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month validity
      });

      await newSubscription.save();
      res.json({ message: "Payment initiated", response });
    } else {
      res.status(400).json({ message: "M-Pesa payment failed" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Subscribe via Stripe
/*
router.post("/stripe", authMiddleware.authenticateUser, async (req, res) => {
  try {
    const { amount, plan } = req.body;
    const sessionUrl = await createStripePayment(amount, req.user.email);

    res.json({ sessionUrl });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
*/

// Subscribe via Flutterwave
router.post("/flutterwave", authenticateUser, async (req, res) => {
  try {
    const { amount, plan, phone } = req.body;
    const paymentLink = await initiateFlutterwavePayment(amount, req.user.email, phone);

    res.json({ paymentLink });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
