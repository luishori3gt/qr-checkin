import { Outlet, useLocation, Link } from "react-router";
import {
  LayoutDashboard,
  QrCode,
  Users,
  Truck,
  History,
  LogOut,
  ScanLine,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/escaner", label: "Escanear QR", icon: ScanLine },
  { path: "/personas", label: "Personas", icon: Users },
  { path: "/transportistas", label: "Lineas", icon: Truck },
  { path: "/historial", label: "Historial", icon: History },
  { path: "/equipo", label: "Mi Equipo", icon: Shield },
];

export default function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("local_auth_token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-4 lg:p-6 border-b border-slate-100">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg text-slate-900 leading-tight truncate">
                QR Check-In
              </h1>
              <p className="text-xs text-slate-500 truncate">
                Control de Asistencia
              </p>
            </div>
          </Link>
          <div className="mt-3 flex items-center gap-2 px-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-600 font-medium truncate">
              En vivo
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 lg:p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            className="w-full flex items-center gap-3 justify-start text-slate-600 hover:text-red-600"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesion
          </Button>
        </div>
      </aside>

      {/* Top Bar - Mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-20 px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 truncate">
            QR Check-In
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-slate-600" />
          ) : (
            <Menu className="w-6 h-6 text-slate-600" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-14 w-64 h-[calc(100vh-3.5rem)] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  className="w-full flex items-center gap-3 justify-start text-slate-600 hover:text-red-600"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesion
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-60 lg:ml-64 pt-14 md:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
