// Initialize express router
import express from "express";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only Admins can access this route
router.get("/dashboard", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Welcome, Admin!" });
});

export default router;