import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  token: string;
  children: ReactNode;
}

export default function ProtectedRoute({ token, children }: ProtectedRouteProps) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
