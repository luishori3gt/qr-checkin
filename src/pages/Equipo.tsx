import { trpc } from "@/providers/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  Shield,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Equipo() {
  const { data: usuarios, isLoading } = trpc.usuarios.list.useQuery();

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  const copyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    toast.success("URL copiada al portapapeles");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Equipo</h1>
        <p className="text-slate-500 mt-1">
          Personas con acceso al sistema
        </p>
      </div>

      {/* Share URL Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800 mb-1">
                Comparte esta URL con tu equipo
              </p>
              <code className="text-xs text-blue-600 bg-white px-3 py-2 rounded-lg block truncate">
                {appUrl}
              </code>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={copyUrl}
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(appUrl, "_blank")}
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Abrir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="w-5 h-5 text-slate-400" />
            Còmo dar acceso a alguien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                1
              </span>
              <span>Copia la URL de arriba y envìasela a la persona</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                2
              </span>
              <span>La persona abre el link y hace clic en "Acceder con Kimi"</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                3
              </span>
              <span>Inicia sesiòn con su cuenta y listo, ya tiene acceso</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                4
              </span>
              <span>Aparecerà automàticamente en esta lista</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" />
                Usuarios con Acceso
              </CardTitle>
              <CardDescription>
                {usuarios?.length ?? 0} personas registradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">
              Cargando usuarios...
            </div>
          ) : usuarios && usuarios.length > 0 ? (
            <div className="space-y-3">
              {usuarios.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name ?? ""}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <UserCheck className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {u.name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {u.email || "Sin email"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant="outline"
                      className={
                        u.role === "admin"
                          ? "border-purple-300 text-purple-700 bg-purple-50 gap-1"
                          : "border-blue-300 text-blue-700 bg-blue-50 gap-1"
                      }
                    >
                      <Shield className="w-3 h-3" />
                      {u.role === "admin" ? "Administrador" : "Usuario"}
                    </Badge>
                    <p className="text-xs text-slate-400 mt-1">
                      {u.lastSignInAt
                        ? new Date(u.lastSignInAt).toLocaleDateString("es-MX")
                        : "Nunca"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No hay usuarios registrados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
