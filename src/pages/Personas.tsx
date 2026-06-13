import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Users,
  Plus,
  Search,
  QrCode,
  Pencil,
  Trash2,
  X,
  Eye,
  Filter,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function Personas() {
  const [searchQuery, setSearchQuery] = useState("");
  const [transportistaFilter, setTransportistaFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);

  // Form states
  const [formNombre, setFormNombre] = useState("");
  const [formTransportistaId, setFormTransportistaId] = useState("");

  const { data: personas, isLoading } = trpc.personas.list.useQuery();
  const { data: transportistas } = trpc.transportistas.list.useQuery();

  const utils = trpc.useUtils();

  const createPersona = trpc.personas.create.useMutation({
    onSuccess: () => {
      toast.success("Persona creada correctamente");
      utils.personas.list.invalidate();
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePersona = trpc.personas.update.useMutation({
    onSuccess: () => {
      toast.success("Persona actualizada correctamente");
      utils.personas.list.invalidate();
      resetForm();
      setShowEditDialog(false);
      setSelectedPersona(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePersona = trpc.personas.delete.useMutation({
    onSuccess: () => {
      toast.success("Persona eliminada correctamente");
      utils.personas.list.invalidate();
      setShowDeleteDialog(false);
      setSelectedPersona(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormNombre("");
    setFormTransportistaId("");
  };

  const handleCreate = () => {
    if (!formNombre.trim() || !formTransportistaId) {
      toast.error("Completa todos los campos");
      return;
    }
    createPersona.mutate({
      nombre: formNombre.trim(),
      transportistaId: Number(formTransportistaId),
    });
  };

  const handleEdit = () => {
    if (!selectedPersona || !formNombre.trim()) return;
    updatePersona.mutate({
      id: selectedPersona.id,
      nombre: formNombre.trim(),
      transportistaId: formTransportistaId
        ? Number(formTransportistaId)
        : undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedPersona) return;
    deletePersona.mutate({ id: selectedPersona.id });
  };

  const openEditDialog = (persona: any) => {
    setSelectedPersona(persona);
    setFormNombre(persona.nombre);
    setFormTransportistaId(String(persona.transportistaId));
    setShowEditDialog(true);
  };

  const openDeleteDialog = (persona: any) => {
    setSelectedPersona(persona);
    setShowDeleteDialog(true);
  };

  const openQRDialog = (persona: any) => {
    setSelectedPersona(persona);
    setShowQRDialog(true);
  };

  // Filter persons
  const filteredPersonas = personas?.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTransportista =
      !transportistaFilter ||
      String(p.transportistaId) === transportistaFilter;
    return matchesSearch && matchesTransportista;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personas</h1>
          <p className="text-slate-500 mt-1">
            Gestiona las personas con còdigos QR
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Persona
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Select
                value={transportistaFilter}
                onValueChange={setTransportistaFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas las lìneas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las lìneas</SelectItem>
                  {transportistas?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {transportistaFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTransportistaFilter("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persons Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">
              Cargando personas...
            </div>
          ) : filteredPersonas && filteredPersonas.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Transportista</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Còdigo QR</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonas.map((persona) => (
                    <TableRow key={persona.id}>
                      <TableCell className="font-medium">
                        {persona.nombre}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                persona.transportistaColor ?? "#3B82F6",
                            }}
                          />
                          <span className="text-sm">
                            {persona.transportistaNombre}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            persona.activo === "si"
                              ? "border-green-300 text-green-700 bg-green-50"
                              : "border-red-300 text-red-700 bg-red-50"
                          }
                        >
                          {persona.activo === "si" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {persona.qrCode.substring(0, 16)}...
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openQRDialog(persona)}
                          >
                            <QrCode className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(persona)}
                          >
                            <Pencil className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(persona)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No se encontraron personas</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setTransportistaFilter("");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Persona</DialogTitle>
            <DialogDescription>
              Crea una nueva persona y se generarà automàticamente su còdigo QR
              ùnico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Nombre completo
              </label>
              <Input
                placeholder="Ej. Juan Pèrez Garcìa"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Transportista / Lìnea
              </label>
              <Select
                value={formTransportistaId}
                onValueChange={setFormTransportistaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una lìnea" />
                </SelectTrigger>
                <SelectContent>
                  {transportistas?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createPersona.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createPersona.isPending ? "Creando..." : "Crear Persona"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Persona</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Nombre completo
              </label>
              <Input
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Transportista / Lìnea
              </label>
              <Select
                value={formTransportistaId}
                onValueChange={setFormTransportistaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una lìnea" />
                </SelectTrigger>
                <SelectContent>
                  {transportistas?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              disabled={updatePersona.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updatePersona.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Eliminar Persona
            </DialogTitle>
            <DialogDescription>
              ¿Estàs seguro de eliminar a{' '}
              <strong>{selectedPersona?.nombre}</strong>? Esta acciòn no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePersona.isPending}
            >
              {deletePersona.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR View Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Còdigo QR
            </DialogTitle>
          </DialogHeader>
          {selectedPersona && (
            <div className="flex flex-col items-center py-4">
              <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm">
                <QRCodeSVG
                  value={selectedPersona.qrCode}
                  size={220}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4">
                {selectedPersona.nombre}
              </h3>
              <p className="text-sm text-slate-500">
                {selectedPersona.transportistaNombre}
              </p>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded mt-2 text-slate-500">
                {selectedPersona.qrCode.substring(0, 24)}...
              </code>
              <div className="flex gap-2 mt-6">
                <Link to={`/qr/${selectedPersona.qrCode}`} target="_blank">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Ver Pàgina
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
