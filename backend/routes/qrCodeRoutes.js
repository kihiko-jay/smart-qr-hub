import express from "express";
import multer from "multer";
import { authenticateUser } from "../middleware/authMiddleware.js"; 
import generateQRCode from "../services/qrCodeService.js";
import QRCode from "../models/QrCode.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Multer configuration for file uploads

/**
 * @route POST /generate
 * @desc Generate a new QR Code
 * @access Private (Requires Authentication)
 */
router.post("/generate", authenticateUser, upload.single("logo"), async (req, res) => {
  try {
    const { data, color } = req.body;
    const logoUrl = req.file ? req.file.path : ""; // Check if file is uploaded

    if (!data) return res.status(400).json({ message: "QR data is required" });

    // Generate QR code URL
    const qrUrl = await generateQRCode(data, color, logoUrl);

    // Save QR code details to the database
    const qrCode = new QRCode({
      userId: req.user._id,
      data,
      qrUrl,
      color,
      logoUrl,
      scanCount: 0, // Ensure scan count is initialized
    });
    await qrCode.save();

    res.json({ message: "QR Code generated", qrCode });
  } catch (err) {
    console.error("Error generating QR Code:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route GET /
 * @desc Get all QR Codes for the authenticated user
 * @access Private (Requires Authentication)
 */
router.get("/", authenticateUser, async (req, res) => {
  try {
    const qrCodes = await QRCode.find({ userId: req.user._id });
    res.json(qrCodes);
  } catch (err) {
    console.error("Error fetching QR codes:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route DELETE /:id
 * @desc Delete a QR Code by ID
 * @access Private (Requires Authentication)
 */
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);
    if (!qrCode) return res.status(404).json({ message: "QR Code not found" });

    await QRCode.findByIdAndDelete(req.params.id);
    res.json({ message: "QR Code deleted" });
  } catch (err) {
    console.error("Error deleting QR code:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route POST /scan/:id
 * @desc Increment scan count when a QR code is scanned
 * @access Public
 */
router.post("/scan/:id", async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);
    if (!qrCode) return res.status(404).json({ message: "QR Code not found" });

    qrCode.scanCount = (qrCode.scanCount || 0) + 1; // Ensure scanCount is always a number
    await qrCode.save();

    res.json({ message: "Scan recorded", scanCount: qrCode.scanCount });
  } catch (error) {
    console.error("Error recording scan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
