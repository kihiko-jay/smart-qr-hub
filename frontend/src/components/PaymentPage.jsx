import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/PaymentPage.module.css";

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handlePayment = async () => {
    setLoading(true);
    setMessage("");

    try {
      if (paymentMethod === "mpesa") {
        if (!/^2547\d{8}$/.test(phone)) {
          setMessage("Please use format: 2547XXXXXXXX");
          return;
        }

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // On successful payment
        navigate("/dashboard/premium");
      } else {
        // Stripe payment would redirect automatically
        setMessage("Redirecting to secure payment...");
        setTimeout(() => {
          navigate("/dashboard/premium");
        }, 1500);
      }
    } catch (error) {
      setMessage("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.content}>
        <h2 className={styles.title}>Upgrade to Premium</h2>
        
        <div className={styles.methodGrid}>
          <div
            className={`${styles.methodCard} ${
              paymentMethod === "mpesa" ? styles.active : ""
            }`}
            onClick={() => setPaymentMethod("mpesa")}
          >
            <div className={styles.methodIcon}>📱</div>
            <h3 className={styles.methodTitle}>M-Pesa</h3>
            <p className={styles.methodDesc}>Instant mobile payment</p>
          </div>

          <div
            className={`${styles.methodCard} ${
              paymentMethod === "stripe" ? styles.active : ""
            }`}
            onClick={() => setPaymentMethod("stripe")}
          >
            <div className={styles.methodIcon}>💳</div>
            <h3 className={styles.methodTitle}>Card</h3>
            <p className={styles.methodDesc}>Visa/Mastercard</p>
          </div>
        </div>

        {paymentMethod === "mpesa" && (
          <div className={styles.inputGroup}>
            <input
              type="tel"
              placeholder="2547XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={styles.input}
            />
            <span className={styles.inputNote}>
              Enter your M-Pesa number
            </span>
          </div>
        )}

        <div className={styles.amountGroup}>
          <label className={styles.amountLabel}>Amount (USD)</label>
          <select 
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={styles.amountInput}
          >
            <option value={10}>$10 - Monthly</option>
            <option value={50}>$50 - 6 Months</option>
            <option value={90}>$90 - Yearly</option>
          </select>
        </div>

        <button
          className={styles.payButton}
          onClick={handlePayment}
          disabled={loading || (paymentMethod === "mpesa" && !phone)}
        >
          {loading ? (
            <div className={styles.spinner}></div>
          ) : (
            `Pay $${amount}`
          )}
        </button>

        {message && (
          <div className={`${styles.message} ${
            message.includes("failed") ? styles.error : styles.success
          }`}>
            {message}
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentPage;