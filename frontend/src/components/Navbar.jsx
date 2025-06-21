import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
    return (
        <nav className={styles.navbar}>
            <h2>QR Code App</h2>
            <div className={styles.navLinks}>
                <Link className={styles.navLink} to="/">Home</Link>
                <Link className={styles.navLink} to="/generate">Generate QR</Link>
                <Link className={styles.navLink} to="/login">Login</Link>
            </div>
        </nav>
    );
};

export default Navbar;
