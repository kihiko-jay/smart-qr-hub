
import mongoose from "mongoose";

const QRCodeSchema = new mongoose.Schema({
  codeId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  destinationUrl: { type: String, required: true },
  isDynamic: { type: Boolean, default: false },
  scanCount: { type: Number, default: 0 },
  expirationDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  data: { type: String, required: true }, // URL or text in QR
  qrUrl: { type: String, required: true }, // S3 URL
  color: { type: String, default: "#000000" },
  logoUrl: { type: String, default: "" },
});

// ✅ Correct: Export AFTER defining the schema
export default mongoose.model("QRCode", QRCodeSchema);
