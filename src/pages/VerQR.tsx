import { useParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  QrCode,
  User,
  Truck,
  Clock,
  Download,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router";

export default function VerQR() {
  const { id } = useParams<{ id: string }>();

  const { data: persona, isLoading } = trpc.personas.getByQrCode.useQuery(
    { qrCode: id ?? "" },
    { enabled: !!id }
  );

  const handlePrint = () => {
    window.print();
  };

  // Generate a data URL from the QR for download
  const handleDownload = () => {
    const svg = document.querySelector("#qr-display svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${persona?.nombre?.replace(/\s+/g, "-").toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <QrCode className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          QR no encontrado
        </h1>
        <p className="text-slate-500 text-center mb-6">
          El còdigo QR que buscas no existe o ha sido eliminado.
        </p>
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Back button */}
        <Link to="/dashboard">
          <Button variant="outline" size="sm" className="gap-2 no-print">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>

        {/* QR Card */}
        <Card className="overflow-hidden border-2 border-slate-200">
          {/* Header with transportista color */}
          <div
            className="h-16 flex items-center justify-center"
            style={{
              backgroundColor: persona.transportistaColor ?? "#3B82F6",
            }}
          >
            <div className="text-center">
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
                Pase de Lista Digital
              </p>
              <p className="text-white font-bold text-lg">
                QR Check-In
              </p>
            </div>
          </div>

          <CardContent className="p-8">
            {/* Person Info */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                {persona.nombre}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Truck className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">
                  {persona.transportistaNombre}
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div
                id="qr-display"
                className="bg-white p-6 rounded-2xl border-2 border-slate-200"
              >
                <QRCodeSVG
                  value={persona.qrCode}
                  size={240}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-sm text-slate-600 mb-2">
                Presenta este còdigo al administrador para registrar tu
                asistencia.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>
                  Registro con timestamp automàtico
                </span>
              </div>
            </div>

            {/* Unique ID */}
            <div className="mt-4 text-center">
              <code className="text-xs text-slate-300">
                ID: {persona.qrCode.substring(0, 32)}...
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 no-print">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
            Descargar PNG
          </Button>
        </div>
      </div>
    </div>
  );
}
