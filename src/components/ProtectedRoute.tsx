import { Navigate } from "react-router";
import type { ReactNode } from "react";

// Check for auth token in localStorage
function hasLocalAuth(): boolean {
  return !!localStorage.getItem("local_auth_token");
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = hasLocalAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
