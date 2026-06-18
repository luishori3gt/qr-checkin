// Auth removed — app is public access
export function useAuth() {
  return {
    user: null,
    isAuthenticated: true,
    isLoading: false,
    isAdmin: false,
    logout: () => {},
  };
}
