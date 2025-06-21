const express = require('express');
const axios = require('axios');
const generateMpesaToken = require('../utils/mpesa');
const router = express.Router();

router.post('/stkpush', async (req, res) => {
    const { phone, amount } = req.body;
    const token = await generateMpesaToken();

    if (!token) return res.status(500).json({ message: "Failed to generate M-Pesa token" });

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    try {
        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phone,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: "QRCode Payment",
            TransactionDesc: "Payment for QR Code Service"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.json({ message: "STK Push Sent", response: response.data });
    } catch (error) {
        console.error('M-Pesa STK Error:', error);
        res.status(500).json({ message: "Failed to send STK Push" });
    }
});

export default router;