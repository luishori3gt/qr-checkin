import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  QrCode,
  ScanLine,
  Clock,
  Users,
  Shield,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";

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
  const [tab, setTab] = useState<"login" | "register">("login");

  // Login form
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Register form
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: () => {
      toast.success("Sesion iniciada correctamente");
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: () => {
      toast.success("Cuenta creada e inicio de sesion exitoso");
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    loginMutation.mutate({ username: loginUser.trim(), password: loginPass });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUser.trim() || !regPass.trim() || !regNombre.trim()) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (regUser.trim().length < 3) {
      toast.error("El usuario debe tener al menos 3 caracteres");
      return;
    }
    if (regPass.length < 4) {
      toast.error("La contrasena debe tener al menos 4 caracteres");
      return;
    }
    registerMutation.mutate({
      username: regUser.trim(),
      password: regPass,
      nombre: regNombre.trim(),
      email: regEmail.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left side - Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
            <QrCode className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">QR Check-In</h1>
          <p className="text-blue-100 text-lg mb-8">
            Sistema de control de asistencia digital para tu equipo de transporte. 
            Registra entradas y salidas escaneando codigos QR en tiempo real.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ScanLine className="w-5 h-5 text-blue-200" />
              <span>Escaneo rapido de codigos QR</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-200" />
              <span>Registro automatico con timestamp</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-200" />
              <span>Acceso multi-usuario para tu equipo</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-200" />
              <span>Seguridad con contrasena o cuenta Kimi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">QR Check-In</h1>
            <p className="text-sm text-slate-500">Control de Asistencia</p>
          </div>

          <Card>
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg">Acceder al Sistema</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">
                    <LogIn className="w-3.5 h-3.5 mr-1" />
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="register">
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Crear Cuenta
                  </TabsTrigger>
                </TabsList>

                {/* Login with password */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Usuario
                      </label>
                      <Input
                        placeholder="Tu nombre de usuario"
                        value={loginUser}
                        onChange={(e) => setLoginUser(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Contrasena
                      </label>
                      <div className="relative">
                        <Input
                          type={showPass ? "text" : "password"}
                          placeholder="Tu contrasena"
                          value={loginPass}
                          onChange={(e) => setLoginPass(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-slate-400">o</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      window.location.href = getOAuthUrl();
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    Acceder con Kimi
                  </Button>
                </TabsContent>

                {/* Register */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Nombre completo *
                      </label>
                      <Input
                        placeholder="Ej. Juan Perez"
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Usuario * (min 3 caracteres)
                      </label>
                      <Input
                        placeholder="Ej. juan.perez"
                        value={regUser}
                        onChange={(e) => setRegUser(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Contrasena * (min 4 caracteres)
                      </label>
                      <div className="relative">
                        <Input
                          type={showRegPass ? "text" : "password"}
                          placeholder="Crea una contrasena"
                          value={regPass}
                          onChange={(e) => setRegPass(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPass(!showRegPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1 block">
                        Email (opcional)
                      </label>
                      <Input
                        type="email"
                        placeholder="Ej. juan@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending
                        ? "Creando cuenta..."
                        : "Crear Cuenta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Share URL */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 mb-1">
              URL del sistema
            </p>
            <code className="text-xs text-blue-600 bg-white px-3 py-2 rounded-lg block break-all">
              {window.location.origin}
            </code>
            <p className="text-xs text-blue-500 mt-2">
              Comparte esta URL con tu equipo para que se registren
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
