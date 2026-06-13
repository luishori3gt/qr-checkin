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
  LogOut,
  ArrowRight,
  Clock,
  Truck,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const { data: stats } = trpc.asistencias.estadisticasHoy.useQuery();
  const { data: recientes } = trpc.asistencias.recientes.useQuery();
  const { data: personasList } = trpc.personas.list.useQuery();
  const { data: transportistasList } = trpc.transportistas.list.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Resumen de asistencias del dìa
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Entradas Hoy</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats?.totalEntradas ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <LogIn className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Salidas Hoy</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats?.totalSalidas ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <LogOut className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Personas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {personasList?.length ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Transportistas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {transportistasList?.length ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asistencias Recientes */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  Asistencias Recientes
                </CardTitle>
                <CardDescription>
                  Últimos registros de entrada y salida
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
            <div className="space-y-3">
              {recientes && recientes.length > 0 ? (
                recientes.slice(0, 8).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-10 rounded-full"
                        style={{
                          backgroundColor: a.transportistaColor ?? "#3B82F6",
                        }}
                      />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {a.personaNombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {a.transportistaNombre}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={a.tipo === "entrada" ? "default" : "secondary"}
                        className={
                          a.tipo === "entrada"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-orange-100 text-orange-700 hover:bg-orange-100"
                        }
                      >
                        {a.tipo === "entrada" ? "Entrada" : "Salida"}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(a.fechaHora).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No hay asistencias registradas hoy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por Transportista */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-400" />
                  Por Transportista
                </CardTitle>
                <CardDescription>
                  Asistencias del dìa agrupadas por lìnea
                </CardDescription>
              </div>
              <Link to="/transportistas">
                <Button variant="ghost" size="sm" className="gap-1">
                  Gestionar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.porTransportista &&
              stats.porTransportista.length > 0 ? (
                stats.porTransportista.map((t) => (
                  <div
                    key={t.transportistaId}
                    className="p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: t.transportistaColor ?? "#3B82F6",
                        }}
                      />
                      <span className="font-medium text-slate-900 text-sm">
                        {t.transportistaNombre}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 bg-white rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-green-600">
                          {t.entradas}
                        </p>
                        <p className="text-xs text-slate-500">Entradas</p>
                      </div>
                      <div className="flex-1 bg-white rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-orange-600">
                          {t.salidas}
                        </p>
                        <p className="text-xs text-slate-500">Salidas</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No hay datos por transportista</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Accesos Ràpidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/escaner">
              <div className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <ScanLine className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Escanear QR</p>
                  <p className="text-sm text-slate-500">
                    Registrar entrada o salida
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/personas">
              <div className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Gestionar Personas</p>
                  <p className="text-sm text-slate-500">
                    Agregar o editar personas
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/historial">
              <div className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Ver Historial</p>
                  <p className="text-sm text-slate-500">
                    Reporte completo de asistencias
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
