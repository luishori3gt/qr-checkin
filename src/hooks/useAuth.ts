import { useCallback, useMemo } from "react";

export function useAuth() {
  const user = null;
  const isLoading = false;
  const isAdmin = false;

  const logout = useCallback(() => {
    document.cookie =
      "local_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    window.location.href = "/login";
  }, []);

  return useMemo(
    () => ({
      user,
      isAuthenticated: false,
      isLoading,
      isAdmin,
      logout,
    }),
    [isLoading, logout]
  );
}
