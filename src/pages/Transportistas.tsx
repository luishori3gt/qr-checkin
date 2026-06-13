import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

export default function Transportistas() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTransportista, setSelectedTransportista] = useState<any>(null);

  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formColor, setFormColor] = useState("#3B82F6");

  const { data: transportistas, isLoading } =
    trpc.transportistas.list.useQuery();

  const utils = trpc.useUtils();

  const createTransportista = trpc.transportistas.create.useMutation({
    onSuccess: () => {
      toast.success("Transportista creado correctamente");
      utils.transportistas.list.invalidate();
      resetForm();
      setShowCreateDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTransportista = trpc.transportistas.update.useMutation({
    onSuccess: () => {
      toast.success("Transportista actualizado correctamente");
      utils.transportistas.list.invalidate();
      resetForm();
      setShowEditDialog(false);
      setSelectedTransportista(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTransportista = trpc.transportistas.delete.useMutation({
    onSuccess: () => {
      toast.success("Transportista eliminado correctamente");
      utils.transportistas.list.invalidate();
      setShowDeleteDialog(false);
      setSelectedTransportista(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormNombre("");
    setFormDescripcion("");
    setFormColor("#3B82F6");
  };

  const handleCreate = () => {
    if (!formNombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    createTransportista.mutate({
      nombre: formNombre.trim(),
      descripcion: formDescripcion || undefined,
      color: formColor,
    });
  };

  const handleEdit = () => {
    if (!selectedTransportista || !formNombre.trim()) return;
    updateTransportista.mutate({
      id: selectedTransportista.id,
      nombre: formNombre.trim(),
      descripcion: formDescripcion || undefined,
      color: formColor,
    });
  };

  const handleDelete = () => {
    if (!selectedTransportista) return;
    deleteTransportista.mutate({ id: selectedTransportista.id });
  };

  const openEditDialog = (t: any) => {
    setSelectedTransportista(t);
    setFormNombre(t.nombre);
    setFormDescripcion(t.descripcion ?? "");
    setFormColor(t.color ?? "#3B82F6");
    setShowEditDialog(true);
  };

  const openDeleteDialog = (t: any) => {
    setSelectedTransportista(t);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transportistas</h1>
          <p className="text-slate-500 mt-1">
            Administra las lìneas de transporte
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
          Nueva Lìnea
        </Button>
      </div>

      {/* Transportistas Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">
          Cargando transportistas...
        </div>
      ) : transportistas && transportistas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transportistas.map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: t.color ?? "#3B82F6" }}
              />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: (t.color ?? "#3B82F6") + "20",
                      }}
                    >
                      <Truck
                        className="w-5 h-5"
                        style={{ color: t.color ?? "#3B82F6" }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {t.nombre}
                      </h3>
                      {t.descripcion && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(t)}
                    >
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(t)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No hay transportistas registrados</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Transportista
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Lìnea de Transporte</DialogTitle>
            <DialogDescription>
              Agrega una nueva lìnea de transporte para asignar a las personas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Nombre
              </label>
              <Input
                placeholder="Ej. Transportes del Norte"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Descripciòn (opcional)
              </label>
              <Input
                placeholder="Breve descripciòn"
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Color identificador
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formColor === color
                        ? "border-slate-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
              disabled={createTransportista.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createTransportista.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transportista</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Nombre
              </label>
              <Input
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Descripciòn
              </label>
              <Input
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">
                Color identificador
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formColor === color
                        ? "border-slate-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
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
              disabled={updateTransportista.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateTransportista.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Lìnea</DialogTitle>
            <DialogDescription>
              ¿Estàs seguro de eliminar{' '}
              <strong>{selectedTransportista?.nombre}</strong>? Las personas
              asociadas perderàn esta asignaciòn.
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
              disabled={deleteTransportista.isPending}
            >
              {deleteTransportista.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
