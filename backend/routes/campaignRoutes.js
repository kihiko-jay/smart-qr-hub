import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import Campaign from "../models/Campaign.js";
import QrCode from "../models/QrCode.js";

import dotenv from "dotenv";
dotenv.config();
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

const router = express.Router();

// Create a new campaign
router.post("/create", authenticateUser, async (req, res) => {
  try {
    const { name, qrCodeIds } = req.body;
    const userId = req.user._id; // ✅ Fix: Use req.user._id instead of req.user.userId

    // Validate QR codes
    const qrCodes = await QrCode.find({ _id: { $in: qrCodeIds }, userId });

    if (qrCodes.length !== qrCodeIds.length) {
      return res.status(400).json({ message: "Some QR codes are invalid or do not belong to the user." });
    }

    const newCampaign = new Campaign({
      userId,
      name,
      qrCodes: qrCodeIds,
      status: "active",
    });

    await newCampaign.save();
    res.status(201).json({ message: "Campaign created successfully", campaign: newCampaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all campaigns for a user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user._id }).populate("qrCodes");
    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add a QR code to an existing campaign
router.put("/add-qrcode/:campaignId", authenticateUser, async (req, res) => {
  try {
    const { qrCodeId } = req.body;
    const campaign = await Campaign.findOne({ _id: req.params.campaignId, userId: req.user._id });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Ensure the QR code belongs to the user
    const qrCode = await QrCode.findOne({ _id: qrCodeId, userId: req.user._id });
    if (!qrCode) {
      return res.status(400).json({ message: "Invalid QR code" });
    }

    campaign.qrCodes.push(qrCodeId);
    await campaign.save();

    res.status(200).json({ message: "QR code added successfully", campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Remove a QR code from a campaign
router.put("/remove-qrcode/:campaignId", authenticateUser, async (req, res) => {
  try {
    const { qrCodeId } = req.body;
    const campaign = await Campaign.findOne({ _id: req.params.campaignId, userId: req.user._id });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    campaign.qrCodes = campaign.qrCodes.filter(id => id.toString() !== qrCodeId);
    await campaign.save();

    res.status(200).json({ message: "QR code removed successfully", campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Activate or deactivate a campaign
router.put("/toggle-status/:campaignId", authenticateUser, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.campaignId, userId: req.user._id });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    campaign.status = campaign.status === "active" ? "inactive" : "active";
    await campaign.save();

    res.status(200).json({ message: `Campaign ${campaign.status}`, campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
