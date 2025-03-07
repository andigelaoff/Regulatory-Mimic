import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
    const { isAuthenticated } = useAuth();

    if (requireAuth && !isAuthenticated) {

        return <Navigate to="/login" replace />;
    }

    if (!requireAuth && isAuthenticated) {
       
        return <Navigate to="/chat" replace />;
    }

    return <>{children}</>;
} 