import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Payment", paymentSchema);
