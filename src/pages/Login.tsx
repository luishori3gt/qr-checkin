import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect immediately to dashboard — no auth needed
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  // Show a brief loading while redirecting
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Cargando QR Check-In...</p>
      </div>
    </div>
  );
}
