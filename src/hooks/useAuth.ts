import { useCallback, useMemo } from "react";

export function useAuth() {
  const logout = useCallback(() => {
    localStorage.removeItem("auth_session");
    window.location.href = "/login";
  }, []);

  return useMemo(
    () => ({
      user: null,
      isAuthenticated: localStorage.getItem("auth_session") === "true",
      isLoading: false,
      isAdmin: false,
      logout,
    }),
    [logout]
  );
}
