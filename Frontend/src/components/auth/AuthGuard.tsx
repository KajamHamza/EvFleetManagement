
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthService from '@/services/auth-service';
import { UserRole } from '@/types/api';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(AuthService.isAuthenticated());
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated && allowedRoles && allowedRoles.length > 0) {
        setIsAuthorized(AuthService.hasRole(allowedRoles));
      } else {
        setIsAuthorized(true);
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [allowedRoles]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAuthorized) {
    // Redirect to dashboard if not authorized
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
