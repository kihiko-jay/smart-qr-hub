import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, enum: ["free", "standard", "premium"], required: true },
  status: { type: String, enum: ["active", "expired"], default: "active" },
  paymentMethod: { type: String, enum: ["mpesa", "stripe", "flutterwave"], required: true },
  transactionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

export default mongoose.model("Subscription", SubscriptionSchema);
