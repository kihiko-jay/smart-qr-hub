import mongoose from "mongoose";
import { Schema, model } from "mongoose";

const CampaignSchema = new mongoose.Schema({
  campaignId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  qrCodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "QrCode" }],
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Campaign", CampaignSchema);
