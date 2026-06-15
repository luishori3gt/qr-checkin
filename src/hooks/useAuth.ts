import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

type UnifiedUser = {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  authType: "oauth" | "local";
};

export function useAuth() {
  // Single query to check session (handles both OAuth and local)
  const { data: sessionUser, isLoading } = trpc.localAuth.check.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
    // If local auth fails, we stay as unauthenticated
  });

  const user: UnifiedUser | null = sessionUser || null;

  const logout = useCallback(() => {
    // Clear local auth cookie
    document.cookie = "local_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    // Redirect to login
    window.location.href = "/login";
  }, []);

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isAdmin: user?.role === "admin",
      logout,
    }),
    [user, isLoading, logout]
  );
}
