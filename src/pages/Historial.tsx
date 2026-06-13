import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  History,
  Download,
  Calendar,
  Filter,
  X,
  LogIn,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function Historial() {
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [transportistaFilter, setTransportistaFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");

  const { data: asistencias, isLoading } = trpc.asistencias.list.useQuery(
    {
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta
        ? new Date(new Date(fechaHasta).getTime() + 86400000)
            .toISOString()
            .split("T")[0]
        : undefined,
      transportistaId: transportistaFilter
        ? Number(transportistaFilter)
        : undefined,
    },
    { refetchInterval: 3000 }
  );

  const { data: transportistas } = trpc.transportistas.list.useQuery();
  const { data: sheetsStatus } = trpc.sheets.status.useQuery(undefined, {
    retry: false,
  });

  const syncMutation = trpc.sheets.sync.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Filter by type locally
  const filteredAsistencias = asistencias?.filter((a) => {
    if (tipoFilter && a.tipo !== tipoFilter) return false;
    return true;
  });

  const hasFilters = fechaDesde || fechaHasta || transportistaFilter || tipoFilter;

  const clearFilters = () => {
    setFechaDesde("");
    setFechaHasta("");
    setTransportistaFilter("");
    setTipoFilter("");
  };

  // Export to CSV
  const exportCSV = () => {
    if (!filteredAsistencias || filteredAsistencias.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const headers = [
      "ID",
      "Persona",
      "Transportista",
      "Tipo",
      "Fecha",
      "Hora",
      "Notas",
    ];

    const rows = filteredAsistencias.map((a) => [
      a.id,
      a.personaNombre ?? "N/A",
      a.transportistaNombre ?? "N/A",
      a.tipo,
      new Date(a.fechaHora).toLocaleDateString("es-MX"),
      new Date(a.fechaHora).toLocaleTimeString("es-MX"),
      a.notas ?? "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `asistencias_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Archivo CSV descargado");
  };

  // Export to Excel (.xlsx) with formatting
  const exportExcel = () => {
    if (!filteredAsistencias || filteredAsistencias.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    // Prepare data
    const data = filteredAsistencias.map((a) => ({
      ID: a.id,
      Persona: a.personaNombre ?? "N/A",
      Transportista: a.transportistaNombre ?? "N/A",
      Tipo: a.tipo === "entrada" ? "Entrada" : "Salida",
      Fecha: new Date(a.fechaHora).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      Hora: new Date(a.fechaHora).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      "Fecha Completa": new Date(a.fechaHora).toLocaleString("es-MX"),
      Notas: a.notas ?? "",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 6 },   // ID
      { wch: 28 },  // Persona
      { wch: 24 },  // Transportista
      { wch: 10 },  // Tipo
      { wch: 12 },  // Fecha
      { wch: 10 },  // Hora
      { wch: 22 },  // Fecha Completa
      { wch: 30 },  // Notas
    ];
    ws["!cols"] = colWidths;

    // Add header styles (bold, background color)
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } },
        alignment: { horizontal: "center" },
      };
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add summary sheet
    const totalEntradas = filteredAsistencias.filter(
      (a) => a.tipo === "entrada"
    ).length;
    const totalSalidas = filteredAsistencias.filter(
      (a) => a.tipo === "salida"
    ).length;

    const summaryData = [
      { "": "Reporte de Asistencias QR Check-In" },
      { "": "" },
      { Campo: "Fecha de generaciòn", Valor: new Date().toLocaleString("es-MX") },
      { Campo: "Total registros", Valor: filteredAsistencias.length },
      { Campo: "Total entradas", Valor: totalEntradas },
      { Campo: "Total salidas", Valor: totalSalidas },
      { Campo: "Rango de fechas", Valor: fechaDesde && fechaHasta ? `${fechaDesde} al ${fechaHasta}` : "Todos" },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 24 }, { wch: 40 }];

    // Style summary title
    if (wsSummary["A1"]) {
      wsSummary["A1"].s = {
        font: { bold: true, sz: 14, color: { rgb: "1E40AF" } },
      };
    }

    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
    XLSX.utils.book_append_sheet(wb, ws, "Asistencias");

    // Save file
    const fechaStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `asistencias_${fechaStr}.xlsx`);

    toast.success("Archivo Excel descargado con formato");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Historial de Asistencias
          </h1>
          <p className="text-slate-500 mt-1">
            Registro completo de entradas y salidas
          </p>
        </div>
        <div className="flex gap-2">
          {sheetsStatus?.configured && (
            <Button
              onClick={() => syncMutation.mutate()}
              variant="outline"
              className="gap-2"
              disabled={syncMutation.isPending}
            >
              <RefreshCw
                className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
              />
              {syncMutation.isPending
                ? "Sincronizando..."
                : "Sync Google Sheets"}
            </Button>
          )}
          <Button
            onClick={exportExcel}
            variant="outline"
            className="gap-2 border-green-300 hover:bg-green-50 hover:text-green-700"
            disabled={!filteredAsistencias || filteredAsistencias.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel
          </Button>
          <Button
            onClick={exportCSV}
            variant="outline"
            className="gap-2"
            disabled={!filteredAsistencias || filteredAsistencias.length === 0}
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="flex-1"
                placeholder="Desde"
              />
              <span className="text-slate-400">-</span>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="flex-1"
                placeholder="Hasta"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select
                value={transportistaFilter}
                onValueChange={setTransportistaFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Transportista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {transportistas?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="salida">Salidas</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Registros
              </CardTitle>
              <CardDescription>
                {filteredAsistencias?.length ?? 0} asistencias encontradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">
              Cargando asistencias...
            </div>
          ) : filteredAsistencias && filteredAsistencias.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Transportista</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAsistencias.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.personaNombre}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                a.transportistaColor ?? "#3B82F6",
                            }}
                          />
                          <span className="text-sm">
                            {a.transportistaNombre}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            a.tipo === "entrada"
                              ? "border-green-300 text-green-700 bg-green-50 gap-1"
                              : "border-orange-300 text-orange-700 bg-orange-50 gap-1"
                          }
                        >
                          {a.tipo === "entrada" ? (
                            <LogIn className="w-3 h-3" />
                          ) : (
                            <LogOut className="w-3 h-3" />
                          )}
                          {a.tipo === "entrada" ? "Entrada" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(a.fechaHora).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {new Date(a.fechaHora).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No se encontraron asistencias</p>
              {hasFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
