import { useCallback, useMemo } from "react";

export function useAuth() {
  const user = null;
  const isLoading = false;
  const isAdmin = false;

  const logout = useCallback(() => {
    localStorage.removeItem("local_auth_token");
    window.location.href = "/login";
  }, []);

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!localStorage.getItem("local_auth_token"),
      isLoading,
      isAdmin,
      logout,
    }),
    [isLoading, logout]
  );
}
