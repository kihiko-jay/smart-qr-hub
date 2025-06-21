import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import HomePage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./components/Dashboard";
import PaymentPage from "./components/PaymentPage";
import Header from "./components/Header";
import MyQrCodes from "./components/MyQrCodes";
import AdminUsers from "./pages/AdminUsers";
import AdminQrCodes from "./pages/AdminQrCodes";
import PremiumDashboard from "./pages/PremiumDashboard";
import CombinedQrGenerator from "./components/CombinedQrGenerator";
import PremiumQRGenerator from "./components/PremiumQRGenerator";
import DashboardHome from "./components/Dashboard";

// Enhanced auth helper with error handling
const getAuth = () => {
  try {
    const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken");
    const userString = sessionStorage.getItem("user") || localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    return { token, user: user?.id ? user : null };
  } catch (error) {
    console.error("Authentication parsing error:", error);
    return { token: null, user: null };
  }
};

// Route guards
const PublicRoute = ({ children }) => {
  const { token } = getAuth();
  return token ? <Navigate to="/dashboard" replace /> : children;
};

const PrivateRoute = ({ children }) => {
  const { token } = getAuth();
  return token ? children : <Navigate to="/login" replace />;
};

const PremiumRoute = ({ children }) => {
  const { token, user } = getAuth();
  if (!token) return <Navigate to="/login" replace />;
  return user?.isPremium ? children : <Navigate to="/payment" replace />;
};

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Main Dashboard Layout */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="combinedQrGenerator" element={<CombinedQrGenerator />} />
          <Route path="my-qrcodes" element={<MyQrCodes />} />
          
          {/* Admin Subroutes */}
          <Route path="admin/users" element={
            <PrivateRoute>
              <AdminUsers />
            </PrivateRoute>
          }/>
          <Route path="admin/qrcodes" element={
            <PrivateRoute>
              <AdminQrCodes />
            </PrivateRoute>
          }/>
        </Route>

        {/* Payment Gateway */}
        <Route path="/payment" element={
          <PrivateRoute>
            <PaymentPage />
          </PrivateRoute>
        }/>

        {/* Premium Features */}
        <Route path="/premium" element={
          <PremiumRoute>
            <PremiumDashboard />
          </PremiumRoute>
        }/>
        <Route path="/premiumQr" element={
          <PremiumRoute>
            <PremiumQRGenerator />
          </PremiumRoute>
        }/>

        {/* Error Handling */}
        <Route path="/404" element={<div>Page Not Found</div>} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Router>
  );
};

export default App;