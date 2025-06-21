import { useState } from 'react';
import axios from 'axios';

const Payment = () => {
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState(10); // $10 or equivalent in KES
    const [currency, setCurrency] = useState('KES');

    const handleMpesaPayment = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/payment/mpesa', { phone, amount });
            alert('M-Pesa request sent. Check your phone.');
        } catch (error) {
            console.error('M-Pesa Payment Error:', error);
            alert('M-Pesa payment failed.');
        }
    };

    const handleStripePayment = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/payment/stripe', { amount, currency });
            window.location.href = `https://checkout.stripe.com/pay/${res.data.clientSecret}`;
        } catch (error) {
            console.error('Stripe Payment Error:', error);
            alert('Stripe payment failed.');
        }
    };

    return (
        <div>
            <h2>Choose a Payment Method</h2>
            <div>
                <h3>M-Pesa</h3>
                <input
                    type="text"
                    placeholder="Enter Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />
                <button onClick={handleMpesaPayment}>Pay with M-Pesa</button>
            </div>

            <div>
                <h3>Stripe</h3>
                <button onClick={handleStripePayment}>Pay with Card</button>
            </div>
        </div>
    );
};

export default Payment;
