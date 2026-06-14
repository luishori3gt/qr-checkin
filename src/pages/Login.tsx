import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Users, ScanLine, Clock, Shield } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">QR Check-In</h1>
          <p className="text-slate-500 mt-1">Control de Asistencia Digital</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-lg">Iniciar Sesiòn</CardTitle>
            <CardDescription>
              Usa tu cuenta para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              onClick={() => {
                window.location.href = getOAuthUrl();
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              Acceder con Kimi
            </Button>
            <p className="text-xs text-center text-slate-400">
              Al acceder, aceptas los tèrminos de uso del sistema
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
            <ScanLine className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Escaneo de QR</p>
            <p className="text-xs text-slate-400">Registro ràpido</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
            <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">En Tiempo Real</p>
            <p className="text-xs text-slate-400">Timestamp automàtico</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Multi-Usuario</p>
            <p className="text-xs text-slate-400">Todo tu equipo</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
            <QrCode className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">Còdigos Ùnicos</p>
            <p className="text-xs text-slate-400">Por transportista</p>
          </div>
        </div>

        {/* URL to share */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 mb-1">
            URL de acceso
          </p>
          <p className="text-xs text-blue-600 break-all font-mono">
            {window.location.origin}
          </p>
          <p className="text-xs text-blue-500 mt-2">
            Comparte esta URL con tu equipo para que puedan acceder
          </p>
        </div>
      </div>
    </div>
  );
}
