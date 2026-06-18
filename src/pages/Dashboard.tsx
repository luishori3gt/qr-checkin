import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ScanLine,
  Users,
  LogIn,
  ArrowRight,
  Clock,
  Truck,
  Bus,
} from "lucide-react";

export default function Dashboard() {
  const isAdmin = true;

  const { data: statsPersonas } =
    trpc.asistencias.estadisticasHoy.useQuery(undefined, {
      refetchInterval: 5000,
    });
  const { data: recientesPersonas } = trpc.asistencias.recientes.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );
  const { data: statsUnidades } =
    trpc.transportistas.estadisticasHoy.useQuery(undefined, {
      refetchInterval: 5000,
    });
  const { data: personasList } = trpc.personas.list.useQuery();
  const { data: transportistasList } = trpc.transportistas.list.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Resumen de asistencias del dia en tiempo real
          </p>
        </div>
        <Link to="/escaner">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <ScanLine className="w-4 h-4" />
            Escanear QR
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Entradas Personas</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {statsPersonas?.totalEntradas ?? 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <LogIn className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Entradas Unidades</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {statsUnidades?.totalEntradas ?? 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Bus className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Total Personas</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {personasList?.length ?? 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Lineas</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {transportistasList?.length ?? 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column: Personas y Unidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asistencias de Personas */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-slate-400" />
                  Asistencias de Personas
                </CardTitle>
                <CardDescription className="text-xs">
                  Ultimos registros de entrada y salida
                </CardDescription>
              </div>
              <Link to="/historial">
                <Button variant="ghost" size="sm" className="gap-1">
                  Ver todo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recientesPersonas && recientesPersonas.length > 0 ? (
                recientesPersonas.slice(0, 6).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2 h-8 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            a.transportistaColor ?? "#3B82F6",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {a.personaNombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {a.transportistaNombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          a.tipo === "entrada"
                            ? "border-green-300 text-green-700 bg-green-50 text-xs"
                            : "border-orange-300 text-orange-700 bg-orange-50 text-xs"
                        }
                      >
                        {a.tipo === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(a.fechaHora).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <p className="text-sm">No hay asistencias de personas hoy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Asistencias de Unidades */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bus className="w-5 h-5 text-slate-400" />
                  Asistencias de Unidades
                </CardTitle>
                <CardDescription className="text-xs">
                  Llegada y salida de transportes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statsUnidades?.recientes &&
              statsUnidades.recientes.length > 0 ? (
                statsUnidades.recientes.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2 h-8 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            a.transportistaColor ?? "#8B5CF6",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {a.transportistaNombre}
                        </p>
                        <p className="text-xs text-slate-500">Unidad</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="outline"
                        className={
                          a.tipo === "entrada"
                            ? "border-green-300 text-green-700 bg-green-50 text-xs"
                            : "border-orange-300 text-orange-700 bg-orange-50 text-xs"
                        }
                      >
                        {a.tipo === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(a.fechaHora).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Bus className="w-8 h-8 mx-auto mb-1 opacity-50" />
                  <p className="text-sm">
                    No hay asistencias de unidades hoy
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/escaner">
          <div className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Escanear QR</p>
              <p className="text-sm text-slate-500">Persona o unidad</p>
            </div>
          </div>
        </Link>
        {isAdmin && (
          <Link to="/personas">
            <div className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Gestionar Personas</p>
                <p className="text-sm text-slate-500">Crear y editar</p>
              </div>
            </div>
          </Link>
        )}
        <Link to="/transportistas">
          <div className="flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Ver Lineas</p>
              <p className="text-sm text-slate-500">QR de unidades</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
