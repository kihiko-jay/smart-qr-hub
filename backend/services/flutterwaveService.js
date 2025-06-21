import axios from "axios";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

const initiateFlutterwavePayment = async (amount, email, phone) => {
  const response = await axios.post(
    "https://api.flutterwave.com/v3/payments",
    {
      tx_ref: `QR-${Date.now()}`,
      amount,
      currency: "KES",
      redirect_url: `${process.env.CLIENT_URL}/payment-success`,
      customer: { email, phone_number: phone },
      payment_options: "card,mpesa,ussd",
    },
    { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
  );

  return response.data.data.link;
};

export { initiateFlutterwavePayment };
