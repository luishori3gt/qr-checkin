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
  // Query OAuth user - silently fail if no OAuth session
  const {
    data: oauthUser,
    isLoading: oauthLoading,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Query local auth user - silently fail if no local session
  const {
    data: localUser,
    isLoading: localLoading,
  } = trpc.localAuth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Determine which user is active
  const user: UnifiedUser | null = useMemo(() => {
    if (oauthUser) {
      return {
        id: oauthUser.id,
        name: oauthUser.name,
        email: oauthUser.email,
        avatar: oauthUser.avatar,
        role: oauthUser.role,
        authType: "oauth" as const,
      };
    }
    if (localUser) {
      return {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        avatar: localUser.avatar,
        role: localUser.role,
        authType: "local" as const,
      };
    }
    return null;
  }, [oauthUser, localUser]);

  const logout = useCallback(() => {
    // Clear any local auth cookie manually
    document.cookie = "local_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    // Refresh page after logout
    window.location.href = "/login";
  }, []);

  // Only loading if BOTH are still loading
  const isLoading = oauthLoading && localLoading;

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
