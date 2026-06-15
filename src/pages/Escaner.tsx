import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ScanLine,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogIn,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Bus,
  User,
} from "lucide-react";

export default function Escaner() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    nombre?: string;
    tipo?: string;
    tipoRegistro?: string;
    fechaHora?: Date;
  } | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<"entrada" | "salida">(
    "entrada"
  );
  const [modoEscaneo, setModoEscaneo] = useState<"persona" | "unidad">(
    "persona"
  );

  const utils = trpc.useUtils();

  // Mutations for both person and transportista
  const registrarPersona = trpc.asistencias.registrar.useMutation({
    onSuccess: (data) => {
      setScanResult({
        success: true,
        message: `Asistencia registrada`,
        nombre: data.personaNombre,
        tipo: "persona",
        tipoRegistro: data.tipo,
        fechaHora: data.fechaHora,
      });
      utils.asistencias.recientes.invalidate();
      utils.asistencias.estadisticasHoy.invalidate();
      toast.success(
        `${data.tipo === "entrada" ? "Entrada" : "Salida"} - ${data.personaNombre}`
      );
    },
    onError: (error) => {
      setScanResult({
        success: false,
        message: error.message,
      });
      toast.error(error.message);
    },
  });

  const registrarTransportista =
    trpc.transportistas.registrarAsistencia.useMutation({
      onSuccess: (data) => {
        setScanResult({
          success: true,
          message: `Asistencia de unidad registrada`,
          nombre: data.transportistaNombre,
          tipo: "unidad",
          tipoRegistro: data.tipo,
          fechaHora: data.fechaHora,
        });
        utils.transportistas.estadisticasHoy.invalidate();
        toast.success(
          `Unidad ${data.tipo === "entrada" ? "entrada" : "salida"} - ${data.transportistaNombre}`
        );
      },
      onError: (error) => {
        setScanResult({
          success: false,
          message: error.message,
        });
        toast.error(error.message);
      },
    });

  // Scanner setup
  useEffect(() => {
    if (!scanning) return;
    let html5QrCode: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        html5QrCode = new Html5Qrcode("qr-reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => handleScan(decodedText),
          () => {}
        );
      } catch {
        toast.error("No se pudo iniciar la camara");
        setScanning(false);
      }
    };

    startScanner();
    return () => {
      if (html5QrCode) html5QrCode.stop().catch(() => {});
    };
  }, [scanning]);

  const handleScan = useCallback(
    (qrCode: string) => {
      if (registrarPersona.isPending || registrarTransportista.isPending)
        return;
      setScanning(false);

      if (modoEscaneo === "persona") {
        registrarPersona.mutate({
          qrCode,
          tipo: tipoRegistro,
        });
      } else {
        registrarTransportista.mutate({
          qrCode,
          tipo: tipoRegistro,
        });
      }
    },
    [
      registrarPersona,
      registrarTransportista,
      tipoRegistro,
      modoEscaneo,
    ]
  );

  const handleScanAgain = () => {
    setScanResult(null);
    setScanning(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Escanear QR</h1>
        <p className="text-slate-500 mt-1">
          Escanea el QR para registrar asistencia automaticamente
        </p>
      </div>

      {/* Mode selector: Persona or Unidad */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <button
              onClick={() => setModoEscaneo("persona")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                modoEscaneo === "persona"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <User className="w-4 h-4" />
              Persona
            </button>
            <button
              onClick={() => setModoEscaneo("unidad")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                modoEscaneo === "unidad"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Bus className="w-4 h-4" />
              Unidad / Linea
            </button>
          </div>
          <p className="text-center text-xs text-slate-400">
            Modo:{" "}
            <Badge
              variant="outline"
              className={
                modoEscaneo === "persona"
                  ? "border-blue-300 text-blue-700 bg-blue-50"
                  : "border-purple-300 text-purple-700 bg-purple-50"
              }
            >
              {modoEscaneo === "persona"
                ? "Asistencia por Persona"
                : "Asistencia por Unidad / Linea"}
            </Badge>
          </p>
        </CardContent>
      </Card>

      {/* Entrada/Salida Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium flex items-center gap-1 ${
                tipoRegistro === "entrada"
                  ? "text-green-700"
                  : "text-slate-400"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Entrada
            </span>
            <button onClick={() => setTipoRegistro((p) => (p === "entrada" ? "salida" : "entrada"))}>
              {tipoRegistro === "entrada" ? (
                <ToggleRight className="w-14 h-8 text-green-600" />
              ) : (
                <ToggleLeft className="w-14 h-8 text-orange-600" />
              )}
            </button>
            <span
              className={`text-sm font-medium flex items-center gap-1 ${
                tipoRegistro === "salida"
                  ? "text-orange-700"
                  : "text-slate-400"
              }`}
            >
              <LogOut className="w-4 h-4" />
              Salida
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Scanner Area */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {!scanning && !scanResult && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mb-6">
                <ScanLine className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Iniciar Escaneo
              </h3>
              <p className="text-slate-500 text-center mb-6 max-w-sm">
                Activa la camara para escanear los codigos QR y registrar
                asistencia de{" "}
                {modoEscaneo === "persona" ? "personas" : "unidades"}
                automaticamente.
              </p>
              <Button
                onClick={() => setScanning(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                size="lg"
              >
                <Camera className="w-5 h-5" />
                Activar Camara
              </Button>
            </div>
          )}

          {scanning && (
            <div className="relative">
              <div className="absolute top-4 left-4 z-10">
                <Badge
                  variant="outline"
                  className="bg-white/90 backdrop-blur text-slate-700 border-slate-300"
                >
                  <ScanLine className="w-3 h-3 mr-1 animate-pulse" />
                  Escaneando...
                </Badge>
              </div>
              <div className="absolute top-4 right-4 z-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScanning(false)}
                  className="bg-white/90 backdrop-blur"
                >
                  <CameraOff className="w-4 h-4 mr-1" />
                  Detener
                </Button>
              </div>
              <div id="qr-reader" className="w-full min-h-[400px] bg-black" />
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white/80 text-sm bg-black/50 inline-block px-4 py-2 rounded-full backdrop-blur">
                  Apunta al codigo QR del{" "}
                  {modoEscaneo === "persona" ? "trabajador" : "transporte"}
                </p>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              {scanResult.success ? (
                <>
                  <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-1">
                    Registro Exitoso!
                  </h3>
                  <p className="text-slate-600 text-center mb-2">
                    {scanResult.nombre}
                  </p>
                  <Badge
                    className={
                      scanResult.tipoRegistro === "entrada"
                        ? "bg-green-100 text-green-700 hover:bg-green-100 mb-2"
                        : "bg-orange-100 text-orange-700 hover:bg-orange-100 mb-2"
                    }
                  >
                    {scanResult.tipo === "unidad" ? "Unidad " : ""}
                    {scanResult.tipoRegistro === "entrada"
                      ? "Entrada"
                      : "Salida"}
                    {scanResult.fechaHora
                      ? ` - ${new Date(scanResult.fechaHora).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                      : ""}
                  </Badge>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Error al Registrar
                  </h3>
                  <p className="text-slate-600 text-center mb-6 max-w-sm">
                    {scanResult.message}
                  </p>
                </>
              )}
              <Button
                onClick={handleScanAgain}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Escanear Otro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
