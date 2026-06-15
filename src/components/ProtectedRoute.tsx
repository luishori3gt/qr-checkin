import { Navigate } from "react-router";
import type { ReactNode } from "react";

// Check for auth cookie directly without waiting for API
function hasAuthCookie(): boolean {
  // Check for local auth token
  const cookies = document.cookie;
  if (cookies.includes("local_auth_token=")) return true;
  // Check for OAuth session (any session cookie)
  if (cookies.includes("session=")) return true;
  // On first load, we can't be sure — show content and let API validate
  // If API returns 401, user will be redirected
  return false;
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  // Quick cookie check
  const isAuthenticated = hasAuthCookie();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
