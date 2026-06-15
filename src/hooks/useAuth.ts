import { trpc } from "@/providers/trpc";
import { useCallback, useMemo, useState, useEffect } from "react";

type UnifiedUser = {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: string;
  authType: "oauth" | "local";
};

export function useAuth() {
  const [timedOut, setTimedOut] = useState(false);

  // Query OAuth user
  const { data: oauthUser, isLoading: oauthLoading } = trpc.auth.me.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 5,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Query local auth user
  const { data: localUser, isLoading: localLoading } =
    trpc.localAuth.me.useQuery(undefined, {
      staleTime: 1000 * 60 * 5,
      retry: false,
      refetchOnWindowFocus: false,
    });

  // Safety timeout: after 2 seconds, stop showing loading
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(timer);
  }, []);

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
    document.cookie =
      "local_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    window.location.href = "/login";
  }, []);

  // Only loading if BOTH are still loading AND we haven't timed out
  const isLoading = !timedOut && oauthLoading && localLoading;

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
