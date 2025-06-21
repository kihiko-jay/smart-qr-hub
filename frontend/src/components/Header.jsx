// Header.jsx
import React from "react";
import styles from "../styles/Header.module.css";

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.mainTitle}>Smart QR Marketing Solutions</h1>
        <div className={styles.taglineContainer}>
          <p className={styles.tagline}>Futuristic Digital Engagement</p>
          <p className={styles.subTagline}>Where Innovation Meets Interaction</p>
        </div>
      </div>
    </header>
  );
};

export default Header;