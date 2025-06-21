import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { verifyAdmin } from '../api/auth';

const ProtectedAdminRoute = () => {
    const [isAdmin, setIsAdmin] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const valid = await verifyAdmin();
                setIsAdmin(valid);
            } catch (err) {
                setIsAdmin(false);
            }
        };
        checkAdminStatus();
    }, []);

    if (isAdmin === null) return <div className="loading-spinner" />;
    
    return isAdmin ? (
        <Outlet />
    ) : (
        <Navigate 
            to="/" 
            state={{ 
                from: location,
                message: "You don't have permission to access this page"
            }} 
            replace 
        />
    );
};

export default ProtectedAdminRoute;