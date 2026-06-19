import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ScanLine,
  Users,
  LogIn,
  ArrowRight,
  Clock,
  Truck,
  Bus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Timer,
  XCircle,
} from "lucide-react";

// Funcion: antes de las 6:00 AM = EN TIEMPO, despues = FUERA DE TIEMPO
const estaEnTiempo = (fechaHora: Date | string): boolean => {
  const fecha = new Date(fechaHora);
  const horas = fecha.getHours();
  const minutos = fecha.getMinutes();
  const totalMinutos = horas * 60 + minutos;
  const limiteMinutos = 6 * 60; // 6:00 AM
  return totalMinutos <= limiteMinutos;
};

export default function Dashboard() {
  const isAdmin = true;
  const [showBorrar, setShowBorrar] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const utils = trpc.useUtils();

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
  const { data: asistenciasUnidadesHoy } =
    trpc.transportistas.listAsistencias.useQuery(undefined, {
      refetchInterval: 5000,
    });
  const { data: personasList } = trpc.personas.list.useQuery();
  const { data: transportistasList } = trpc.transportistas.list.useQuery();

  const borrarPersonas = trpc.asistencias.borrarTodo.useMutation({
    onSuccess: () => {
      utils.asistencias.estadisticasHoy.invalidate();
      utils.asistencias.recientes.invalidate();
      utils.asistencias.list.invalidate();
      toast.success("Asistencias de personas eliminadas");
    },
    onError: (err) => toast.error(err.message),
  });

  const borrarUnidades = trpc.transportistas.borrarTodo.useMutation({
    onSuccess: () => {
      utils.transportistas.estadisticasHoy.invalidate();
      utils.transportistas.listAsistencias.invalidate();
      toast.success("Asistencias de unidades eliminadas");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleBorrar = () => {
    if (confirmText !== "BORRAR") {
      toast.error('Escribe "BORRAR" para confirmar');
      return;
    }
    borrarPersonas.mutate({ confirmar: "BORRAR" });
    borrarUnidades.mutate({ confirmar: "BORRAR" });
    setShowBorrar(false);
    setConfirmText("");
  };

  // Calcular estadisticas de tiempo para personas
  const entradasPersonasHoy = (recientesPersonas || []).filter(
    (a: any) => a.tipo === "entrada"
  );
  const entradasPersonasEnTiempo = entradasPersonasHoy.filter((a: any) =>
    estaEnTiempo(a.fechaHora)
  );
  const entradasPersonasFueraTiempo = entradasPersonasHoy.filter(
    (a: any) => !estaEnTiempo(a.fechaHora)
  );

  // Calcular estadisticas de tiempo para unidades
  const entradasUnidadesHoy = (statsUnidades?.recientes || []).filter(
    (a: any) => a.tipo === "entrada"
  );
  const entradasUnidadesEnTiempo = entradasUnidadesHoy.filter((a: any) =>
    estaEnTiempo(a.fechaHora)
  );
  const entradasUnidadesFueraTiempo = entradasUnidadesHoy.filter(
    (a: any) => !estaEnTiempo(a.fechaHora)
  );

  // Agrupar unidades por ruta
  const unidadesPorRuta = (asistenciasUnidadesHoy || [])
    .filter((a: any) => a.tipo === "entrada" && a.ruta)
    .reduce((acc: Record<string, any[]>, u: any) => {
      const key = `${u.transportistaNombre} | ${u.ruta}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(u);
      return acc;
    }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Resumen de asistencias del dia — Limite: 6:00 AM
          </p>
        </div>
        <div className="flex gap-2">
          {!showBorrar ? (
            <Button
              onClick={() => setShowBorrar(true)}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Borrar dia
            </Button>
          ) : (
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Escribe BORRAR"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-36 text-sm"
              />
              <Button
                onClick={handleBorrar}
                className="bg-red-600 hover:bg-red-700 text-white gap-1"
                size="sm"
              >
                <AlertTriangle className="w-3 h-3" />
                Confirmar
              </Button>
              <Button
                onClick={() => {
                  setShowBorrar(false);
                  setConfirmText("");
                }}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          )}
          <Link to="/escaner">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <ScanLine className="w-4 h-4" />
              Escanear QR
            </Button>
          </Link>
        </div>
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

      {/* NIVEL DE SERVICIO — Personas y Unidades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Nivel de Servicio Personas */}
        {(() => {
          const totalPersonas = entradasPersonasHoy.length;
          const enTiempoPersonas = entradasPersonasEnTiempo.length;
          const fueraTiempoPersonas = entradasPersonasFueraTiempo.length;
          const pctPersonas =
            totalPersonas > 0
              ? Math.round((enTiempoPersonas / totalPersonas) * 100)
              : 0;
          const colorPersonas =
            pctPersonas >= 80
              ? "green"
              : pctPersonas >= 50
                ? "orange"
                : "red";
          const colors: Record<string, { bg: string; border: string; text: string; bar: string; badge: string }> =
            {
              green: {
                bg: "bg-green-50",
                border: "border-green-200",
                text: "text-green-700",
                bar: "bg-green-500",
                badge: "bg-green-100 text-green-700 border-green-300",
              },
              orange: {
                bg: "bg-orange-50",
                border: "border-orange-200",
                text: "text-orange-700",
                bar: "bg-orange-500",
                badge: "bg-orange-100 text-orange-700 border-orange-300",
              },
              red: {
                bg: "bg-red-50",
                border: "border-red-200",
                text: "text-red-700",
                bar: "bg-red-500",
                badge: "bg-red-100 text-red-700 border-red-300",
              },
            };
          const c = colors[colorPersonas];

          return (
            <Card className={`${c.border} ${c.bg}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className={`w-5 h-5 ${c.text}`} />
                    <span className="text-sm font-semibold text-slate-700">
                      Nivel de Servicio — Personas
                    </span>
                  </div>
                  <span className={`text-4xl font-bold ${c.text}`}>
                    {pctPersonas}%
                  </span>
                </div>
                {/* Barra de progreso */}
                <div className="w-full h-3 bg-white rounded-full overflow-hidden mb-3 border border-slate-200">
                  <div
                    className={`h-full ${c.bar} rounded-full transition-all`}
                    style={{ width: `${pctPersonas}%` }}
                  />
                </div>
                {/* Desglose */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <Badge variant="outline" className={c.badge}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {enTiempoPersonas} en tiempo
                  </Badge>
                  <Badge variant="outline" className="bg-white border-red-300 text-red-700">
                    <XCircle className="w-3 h-3 mr-1" />
                    {fueraTiempoPersonas} fuera de tiempo
                  </Badge>
                  <span className="font-medium">
                    Total: {totalPersonas}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Nivel de Servicio Unidades */}
        {(() => {
          const totalUnidades = entradasUnidadesHoy.length;
          const enTiempoUnidades = entradasUnidadesEnTiempo.length;
          const fueraTiempoUnidades = entradasUnidadesFueraTiempo.length;
          const pctUnidades =
            totalUnidades > 0
              ? Math.round((enTiempoUnidades / totalUnidades) * 100)
              : 0;
          const colorUnidades =
            pctUnidades >= 80
              ? "green"
              : pctUnidades >= 50
                ? "orange"
                : "red";
          const colors: Record<string, { bg: string; border: string; text: string; bar: string; badge: string }> =
            {
              green: {
                bg: "bg-green-50",
                border: "border-green-200",
                text: "text-green-700",
                bar: "bg-green-500",
                badge: "bg-green-100 text-green-700 border-green-300",
              },
              orange: {
                bg: "bg-orange-50",
                border: "border-orange-200",
                text: "text-orange-700",
                bar: "bg-orange-500",
                badge: "bg-orange-100 text-orange-700 border-orange-300",
              },
              red: {
                bg: "bg-red-50",
                border: "border-red-200",
                text: "text-red-700",
                bar: "bg-red-500",
                badge: "bg-red-100 text-red-700 border-red-300",
              },
            };
          const c = colors[colorUnidades];

          return (
            <Card className={`${c.border} ${c.bg}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bus className={`w-5 h-5 ${c.text}`} />
                    <span className="text-sm font-semibold text-slate-700">
                      Nivel de Servicio — Unidades
                    </span>
                  </div>
                  <span className={`text-4xl font-bold ${c.text}`}>
                    {pctUnidades}%
                  </span>
                </div>
                {/* Barra de progreso */}
                <div className="w-full h-3 bg-white rounded-full overflow-hidden mb-3 border border-slate-200">
                  <div
                    className={`h-full ${c.bar} rounded-full transition-all`}
                    style={{ width: `${pctUnidades}%` }}
                  />
                </div>
                {/* Desglose */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <Badge variant="outline" className={c.badge}>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {enTiempoUnidades} en tiempo
                  </Badge>
                  <Badge variant="outline" className="bg-white border-red-300 text-red-700">
                    <XCircle className="w-3 h-3 mr-1" />
                    {fueraTiempoUnidades} fuera de tiempo
                  </Badge>
                  <span className="font-medium">
                    Total: {totalUnidades}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

      {/* Unidades por Ruta — Tabla resumen */}
      {Object.keys(unidadesPorRuta).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-5 h-5 text-slate-400" />
              Unidades por Ruta / Tienda
            </CardTitle>
            <CardDescription className="text-xs">
              Entradas de hoy agrupadas por linea y ruta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(unidadesPorRuta)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, registros]: [string, any[]]) => {
                  const [linea, ruta] = key.split(" | ");
                  const enTiempoCount = registros.filter((r) =>
                    estaEnTiempo(r.fechaHora)
                  ).length;
                  const fueraTiempoCount =
                    registros.length - enTiempoCount;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Bus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {linea}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" />
                            {ruta}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          {enTiempoCount > 0 && (
                            <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {enTiempoCount}
                            </Badge>
                          )}
                          {fueraTiempoCount > 0 && (
                            <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                              <XCircle className="w-3 h-3" />
                              {fueraTiempoCount}
                            </Badge>
                          )}
                        </div>
                        <span className="text-lg font-bold text-slate-700">
                          {registros.length}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

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
                recientesPersonas.slice(0, 6).map((a: any) => (
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
                      <div className="mt-0.5">
                        {estaEnTiempo(a.fechaHora) ? (
                          <span className="text-[10px] text-green-600 flex items-center justify-end gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            En tiempo
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-500 flex items-center justify-end gap-0.5">
                            <XCircle className="w-3 h-3" />
                            Fuera de tiempo
                          </span>
                        )}
                      </div>
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
                statsUnidades.recientes.map((a: any) => (
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
                        {a.ruta && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" />
                            {a.ruta}
                          </div>
                        )}
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
                      <div className="mt-0.5">
                        {estaEnTiempo(a.fechaHora) ? (
                          <span className="text-[10px] text-green-600 flex items-center justify-end gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            En tiempo
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-500 flex items-center justify-end gap-0.5">
                            <XCircle className="w-3 h-3" />
                            Fuera de tiempo
                          </span>
                        )}
                      </div>
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
