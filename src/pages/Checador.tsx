import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Bus,
  User,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { getRutasPorLinea } from "@contracts/rutas";

type ScanResult = {
  ok: boolean;
  msg: string;
  name?: string;
  tipo?: string;
  time?: string;
  mode?: string;
  ruta?: string;
} | null;

type TransportistaInfo = {
  id: number;
  nombre: string;
  color: string;
} | null;

export default function Checador() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [tipo, setTipo] = useState<"entrada" | "salida">("entrada");
  const [modo, setModo] = useState<"persona" | "unidad">("persona");

  // Modal de rutas
  const [showRutaModal, setShowRutaModal] = useState(false);
  const [scannedTransportista, setScannedTransportista] = useState<TransportistaInfo>(null);
  const [selectedRuta, setSelectedRuta] = useState("");
  const [customRuta, setCustomRuta] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [pendingQrCode, setPendingQrCode] = useState("");

  const utils = trpc.useUtils();

  const registrarPersona = trpc.asistencias.registrar.useMutation({
    onSuccess: (data) => {
      setResult({
        ok: true,
        name: data.personaNombre,
        tipo: data.tipo,
        time: new Date(data.fechaHora).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        mode: "persona",
        msg: "Registrado",
      });
      utils.asistencias.recientes.invalidate();
      utils.asistencias.estadisticasHoy.invalidate();
      toast.success(`${data.personaNombre} - ${data.tipo}`);
    },
    onError: (err) => {
      setResult({ ok: false, msg: err.message });
      toast.error(err.message);
    },
  });

  const registrarUnidad = trpc.transportistas.registrarAsistencia.useMutation({
    onSuccess: (data) => {
      setResult({
        ok: true,
        name: data.transportistaNombre,
        tipo: data.tipo,
        ruta: data.ruta,
        time: new Date(data.fechaHora).toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
        mode: "unidad",
        msg: "Unidad registrada",
      });
      utils.transportistas.estadisticasHoy.invalidate();
      toast.success(`${data.transportistaNombre} - ${data.tipo} - ${data.ruta || "Sin ruta"}`);
    },
    onError: (err) => {
      setResult({ ok: false, msg: err.message });
      toast.error(err.message);
    },
  });

  // Scanner
  useEffect(() => {
    if (!scanning) return;
    let html5QrCode: any = null;

    const start = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        html5QrCode = new Html5Qrcode("qr-reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text: string) => {
            setScanning(false);
            handleQrScanned(text);
          },
          () => {}
        );
      } catch {
        toast.error("No se pudo iniciar la camara");
        setScanning(false);
      }
    };

    start();
    return () => {
      if (html5QrCode) html5QrCode.stop().catch(() => {});
    };
  }, [scanning]);

  const handleQrScanned = (qrCode: string) => {
    if (modo === "persona") {
      registrarPersona.mutate({ qrCode, tipo });
    } else {
      // Para unidades: buscar el transportista y mostrar modal de rutas
      handleUnidadScanned(qrCode);
    }
  };

  // Query para buscar transportista por QR (usamos trpc.useUtils para llamarla)
  const getByQrCodeMut = trpc.transportistas.getByQrCode.useMutation({
    onSuccess: (transportista) => {
      if (!transportista) {
        setResult({ ok: false, msg: "QR no valido o transportista no encontrado" });
        toast.error("QR no valido o transportista no encontrado");
        return;
      }
      const rutas = getRutasPorLinea(transportista.nombre);
      setScannedTransportista({
        id: transportista.id,
        nombre: transportista.nombre,
        color: transportista.color || "#3B82F6",
      });
      setSelectedRuta("");
      setCustomRuta("");
      setShowCustomInput(false);

      if (rutas.length > 0) {
        setShowRutaModal(true);
      } else {
        setShowRutaModal(true);
        setShowCustomInput(true);
      }
    },
    onError: () => {
      setResult({ ok: false, msg: "Error al buscar transportista" });
      toast.error("Error al buscar transportista");
    },
  });

  const handleUnidadScanned = (qrCode: string) => {
    setPendingQrCode(qrCode);
    getByQrCodeMut.mutate({ qrCode });
  };

  const confirmarRegistroUnidad = () => {
    const ruta = showCustomInput ? customRuta.trim() : selectedRuta;
    if (!ruta) {
      toast.error("Selecciona o escribe una ruta/tienda");
      return;
    }
    setShowRutaModal(false);
    registrarUnidad.mutate({ qrCode: pendingQrCode, tipo, ruta });
  };

  const cancelarModal = () => {
    setShowRutaModal(false);
    setScannedTransportista(null);
    setSelectedRuta("");
    setCustomRuta("");
    setShowCustomInput(false);
    setPendingQrCode("");
  };

  const scanAgain = () => {
    setResult(null);
    setScanning(true);
  };

  const rutas = scannedTransportista ? getRutasPorLinea(scannedTransportista.nombre) : [];

  // MODAL DE RUTAS
  if (showRutaModal && scannedTransportista) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* Header */}
          <div className="text-center pt-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: scannedTransportista.color }}
            >
              <Bus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {scannedTransportista.nombre}
            </h1>
            <p className="text-sm text-slate-500">
              Selecciona la tienda / ruta
            </p>
          </div>

          {/* Tipo de registro actual */}
          <div className="text-center">
            <Badge
              className={
                tipo === "entrada"
                  ? "bg-green-100 text-green-700 border-green-300 text-sm px-3 py-1"
                  : "bg-orange-100 text-orange-700 border-orange-300 text-sm px-3 py-1"
              }
            >
              {tipo === "entrada" ? "ENTRADA" : "SALIDA"}
            </Badge>
          </div>

          {/* Lista de rutas */}
          <Card>
            <CardContent className="p-3">
              {rutas.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {rutas.map((ruta) => (
                    <button
                      key={ruta}
                      onClick={() => {
                        setSelectedRuta(ruta);
                        setShowCustomInput(false);
                        setCustomRuta("");
                      }}
                      className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                        selectedRuta === ruta
                          ? "bg-blue-600 text-white shadow-lg scale-[1.02]"
                          : "bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <MapPin
                        className={`w-5 h-5 flex-shrink-0 ${
                          selectedRuta === ruta ? "text-white" : "text-slate-400"
                        }`}
                      />
                      <span className="font-medium text-base">{ruta}</span>
                      {selectedRuta === ruta && (
                        <CheckCircle2 className="w-5 h-5 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Boton Otra ruta */}
              {!showCustomInput && (
                <button
                  onClick={() => {
                    setShowCustomInput(true);
                    setSelectedRuta("");
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all mt-2 ${
                    showCustomInput
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white border-2 border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <MapPin className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-base">Otra ruta / tienda</span>
                </button>
              )}

              {/* Input para ruta manual */}
              {showCustomInput && (
                <div className="mt-3 space-y-2">
                  <Input
                    placeholder="Escribe la tienda o ruta..."
                    value={customRuta}
                    onChange={(e) => setCustomRuta(e.target.value)}
                    className="text-base py-5"
                    autoFocus
                  />
                  {rutas.length > 0 && (
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomRuta("");
                      }}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Volver a la lista
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botones de accion */}
          <div className="space-y-2">
            <Button
              onClick={confirmarRegistroUnidad}
              className="w-full py-6 text-lg font-semibold gap-2"
              style={{ backgroundColor: scannedTransportista.color }}
              disabled={!selectedRuta && !customRuta.trim()}
            >
              <CheckCircle2 className="w-5 h-5" />
              Confirmar {tipo === "entrada" ? "Entrada" : "Salida"}
            </Button>
            <Button
              onClick={cancelarModal}
              variant="outline"
              className="w-full py-5 text-base"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Checador QR</h1>
          <p className="text-sm text-slate-500">Registro de asistencia</p>
        </div>

        {/* Mode selector */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <button
                onClick={() => setModo("persona")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                  modo === "persona"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <User className="w-4 h-4" />
                Persona
              </button>
              <button
                onClick={() => setModo("unidad")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                  modo === "unidad"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Bus className="w-4 h-4" />
                Unidad
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Entry/Exit toggle */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-center gap-4">
              <span
                className={`text-sm font-medium ${
                  tipo === "entrada" ? "text-green-700" : "text-slate-400"
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-1" />
                Entrada
              </span>
              <button
                onClick={() =>
                  setTipo((p) => (p === "entrada" ? "salida" : "entrada"))
                }
                className="relative w-14 h-7 rounded-full transition-colors"
                style={{
                  backgroundColor: tipo === "entrada" ? "#22c55e" : "#f97316",
                }}
              >
                <div
                  className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform"
                  style={{
                    left: tipo === "entrada" ? 2 : 28,
                  }}
                />
              </button>
              <span
                className={`text-sm font-medium ${
                  tipo === "salida" ? "text-orange-700" : "text-slate-400"
                }`}
              >
                <LogOut className="w-4 h-4 inline mr-1" />
                Salida
              </span>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              Registrando:{" "}
              <Badge
                variant="outline"
                className={
                  tipo === "entrada"
                    ? "border-green-300 text-green-700 bg-green-50"
                    : "border-orange-300 text-orange-700 bg-orange-50"
                }
              >
                {tipo === "entrada" ? "ENTRADAS" : "SALIDAS"}
              </Badge>
            </p>
          </CardContent>
        </Card>

        {/* Scanner area */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {!scanning && !result && (
              <div className="flex flex-col items-center py-10 px-4">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <ScanLine className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-slate-500 text-center text-sm mb-5">
                  Apunta la camara al codigo QR del {modo}
                </p>
                <Button
                  onClick={() => setScanning(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  size="lg"
                >
                  <Camera className="w-5 h-5" />
                  Escanear QR
                </Button>
                {/* Quick instructions */}
                <div className="mt-6 bg-slate-50 rounded-lg p-3 text-xs text-slate-500 text-left w-full">
                  <p className="font-medium text-slate-700 mb-1">
                    Instrucciones:
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Selecciona Persona o Unidad arriba</li>
                    <li>Elige Entrada o Salida</li>
                    <li>Presiona "Escanear QR"</li>
                    <li>Apunta la camara al codigo</li>
                    {modo === "unidad" ? (
                      <li>Selecciona la tienda/ruta en la pantalla</li>
                    ) : (
                      <li>El registro se hace automatico</li>
                    )}
                  </ol>
                </div>
              </div>
            )}

            {scanning && (
              <div className="relative">
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-white/90 text-slate-700">
                    <ScanLine className="w-3 h-3 mr-1 animate-pulse" />
                    Escaneando...
                  </Badge>
                </div>
                <div className="absolute top-3 right-3 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScanning(false)}
                    className="bg-white/90"
                  >
                    <CameraOff className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
                <div
                  id="qr-reader"
                  className="w-full min-h-[350px] bg-black"
                />
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <p className="text-white/80 text-xs bg-black/50 inline-block px-3 py-1.5 rounded-full">
                    Apunta al QR del {modo}
                  </p>
                </div>
              </div>
            )}

            {result && (
              <div className="flex flex-col items-center py-10 px-4">
                {result.ok ? (
                  <>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-green-800">
                      {result.msg}
                    </h3>
                    <p className="text-xl font-semibold text-slate-900 mt-2">
                      {result.name}
                    </p>
                    {result.ruta && (
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {result.ruta}
                      </p>
                    )}
                    <Badge
                      className={
                        result.tipo === "entrada"
                          ? "bg-green-100 text-green-700 hover:bg-green-100 mt-2"
                          : "bg-orange-100 text-orange-700 hover:bg-orange-100 mt-2"
                      }
                    >
                      {result.tipo === "entrada" ? "ENTRADA" : "SALIDA"} -{" "}
                      {result.time}
                    </Badge>
                    {result.mode === "unidad" && (
                      <p className="text-xs text-slate-400 mt-1">Unidad</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-red-800">Error</h3>
                    <p className="text-slate-600 text-center mt-2">
                      {result.msg}
                    </p>
                  </>
                )}
                <Button
                  onClick={scanAgain}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Escanear Otro
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer link to admin */}
        <div className="text-center pb-4">
          <a
            href="/"
            className="text-xs text-blue-600 hover:underline"
          >
            Ir al panel de administracion
          </a>
        </div>
      </div>
    </div>
  );
}
