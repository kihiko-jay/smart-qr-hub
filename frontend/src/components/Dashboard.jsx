import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import { FiUsers, FiPackage, FiLogOut, FiMenu } from "react-icons/fi";
import { FaQrcode } from "react-icons/fa";
import styles from "../styles/Dashboard.module.css";

const getInitials = (username) => {
  if (!username) return "U";
  return username
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalCodes: 0, monthlyScans: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchStats = useCallback(async (token) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/api/qrcodes/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error("Stats fetch error:", err);
      setError(prev => prev || "Failed to load statistics");
    }
  }, []);

  const handleAuthError = useCallback((err) => {
    console.error("Auth error:", err);
    const errorMessage = err.response?.data?.message || "Authentication failed";
    setError(errorMessage);
    
    if (err.response?.status === 401) {
      sessionStorage.clear();
      navigate("/login");
    }
  }, [navigate]);

  const fetchUser = useCallback(async () => {
    try {
      const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = res.data;
      sessionStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      await fetchStats(token);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, handleAuthError, navigate]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser) return;
      } catch (e) {
        console.error("User data parsing error:", e);
        sessionStorage.removeItem("user");
      }
    }
    
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const checkSession = () => {
      const token = sessionStorage.getItem("token");
      if (!token) navigate("/login");
    };

    window.addEventListener("storage", checkSession);
    return () => window.removeEventListener("storage", checkSession);
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const initials = useMemo(() => getInitials(user?.username), [user?.username]);

  if (loading) return (
    <div className={styles.dashboardContainer}>
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    </div>
  );

  if (error) return (
    <div className={styles.dashboardContainer}>
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button onClick={() => window.location.reload()}>Retry</button>
            <button onClick={() => navigate("/login")}>Login Again</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.userInitials}>{initials}</div>
          <div className={styles.userInfo}>
            <h3>{user?.username || "User"}</h3>
            <p>{user?.email || ""}</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <Link 
            to="/dashboard" 
            className={`${styles.navItem} ${location.pathname === '/dashboard' ? styles.active : ''}`}
          >
            <FiPackage className={styles.navIcon} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/dashboard/combinedQrGenerator" 
            className={`${styles.navItem} ${location.pathname.includes('combinedQrGenerator') ? styles.active : ''}`}
          >
            <FaQrcode className={styles.navIcon} />
            <span>QR Generator</span>
          </Link>
          <Link 
            to="/dashboard/my-qrcodes" 
            className={`${styles.navItem} ${location.pathname.includes('my-qrcodes') ? styles.active : ''}`}
          >
            <FiPackage className={styles.navIcon} />
            <span>My QR Codes</span>
          </Link>
          {user?.role === 'admin' && (
            <>
              <Link 
                to="/admin/users" 
                className={`${styles.navItem} ${location.pathname.includes('admin/users') ? styles.active : ''}`}
              >
                <FiUsers className={styles.navIcon} />
                <span>User Management</span>
              </Link>
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <FiLogOut className={styles.navIcon} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.menuButton}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <FiMenu />
            </button>
            <h2>
              {location.pathname.includes('combinedQrGenerator') && 'QR Code Generator'}
              {location.pathname.includes('my-qrcodes') && 'My QR Codes'}
              {location.pathname === '/dashboard' && 'Dashboard'}
              {location.pathname.includes('admin/users') && 'User Management'}
            </h2>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={() => navigate('/dashboard/combinedQrGenerator')}
              className={styles.primaryButton}
            >
              <FaQrcode /> Create QR
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <Link 
              to="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FiPackage /> Dashboard
            </Link>
            <Link 
              to="/dashboard/combinedQrGenerator" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FaQrcode /> QR Generator
            </Link>
            <Link 
              to="/dashboard/my-qrcodes" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <FiPackage /> My QR Codes
            </Link>
            {user?.role === 'admin' && (
              <Link 
                to="/admin/users" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FiUsers /> User Management
              </Link>
            )}
            <button onClick={handleLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;