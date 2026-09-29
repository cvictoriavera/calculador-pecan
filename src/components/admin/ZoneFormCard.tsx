import { useState, useEffect } from 'react';
import type { GeographicZone, GeographicTerritory, TerritoryConflict } from '@/types/zone';
import { getTerritoryTree, checkZoneConflicts, createZone, updateZone } from '@/services/zoneService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, Check, Plus, X } from 'lucide-react';
import { TerritoryTreeSelect } from './TerritoryTreeSelect';
import { ZoneConflictAlert } from './ZoneConflictAlert';

interface ZoneFormCardProps {
  onSuccess: () => void;
  editingZone?: GeographicZone | null;
  onCancelEdit?: () => void;
  userCountryId: number;
  userCountryName: string;
}

export const ZoneFormCard = ({
  onSuccess,
  editingZone,
  onCancelEdit,
  userCountryId,
  userCountryName,
}: ZoneFormCardProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTerritoryIds, setSelectedTerritoryIds] = useState<number[]>([]);
  const [territoryTree, setTerritoryTree] = useState<GeographicTerritory[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<TerritoryConflict[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setConflicts([]);

    if (editingZone) {
      setName(editingZone.name || '');
      setDescription(editingZone.description || '');
      setSelectedTerritoryIds(editingZone.territory_ids || []);
    } else {
      setName('');
      setDescription('');
      setSelectedTerritoryIds([]);
    }

    loadTree();
  }, [editingZone, userCountryId]);

  const loadTree = async () => {
    setLoadingTree(true);
    try {
      const tree = await getTerritoryTree(userCountryId, editingZone?.id);
      setTerritoryTree(tree);
    } catch (err: any) {
      console.error('Error cargando árbol territorial:', err);
      setError('No se pudo cargar el árbol de territorios.');
    } finally {
      setLoadingTree(false);
    }
  };

  const handleResetForm = () => {
    setName('');
    setDescription('');
    setSelectedTerritoryIds([]);
    setError(null);
    setConflicts([]);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('El nombre de la zona es obligatorio.');
      return;
    }

    if (selectedTerritoryIds.length === 0) {
      setError('Debes seleccionar al menos un territorio para la zona.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setConflicts([]);

    try {
      // Validar conflictos antes de guardar
      const conflictCheck = await checkZoneConflicts(userCountryId, selectedTerritoryIds, editingZone?.id);

      if (conflictCheck.has_conflicts) {
        setConflicts(conflictCheck.conflicts);
        setSubmitting(false);
        return;
      }

      if (editingZone) {
        await updateZone(editingZone.id, {
          country_id: userCountryId,
          name,
          description,
          territory_ids: selectedTerritoryIds,
        });
      } else {
        await createZone({
          country_id: userCountryId,
          name,
          description,
          territory_ids: selectedTerritoryIds,
        });
      }

      // Limpiar formulario tras guardado exitoso
      setName('');
      setDescription('');
      setSelectedTerritoryIds([]);
      onSuccess();
      if (onCancelEdit && editingZone) {
        onCancelEdit();
      }
    } catch (err: any) {
      console.error('Error guardando zona:', err);
      setError(err?.message || 'Ocurrió un error al guardar la zona geográfica.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {editingZone ? (
              <>
                <span>Editar Zona Geográfica</span>
                <Badge variant="outline" className="text-xs font-normal">ID: #{editingZone.id}</Badge>
              </>
            ) : (
              <span>Crear Nueva Zona Geográfica</span>
            )}
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1.5 text-xs py-1 px-2.5 w-fit">
            <Globe className="h-3.5 w-3.5 text-primary" />
            País: <strong className="font-semibold">{userCountryName}</strong>
          </Badge>
        </div>
        <CardDescription>
          Configura el nombre y selecciona los territorios administrativos que conformarán la zona.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form id="zone-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/30">
              {error}
            </div>
          )}

          <ZoneConflictAlert conflicts={conflicts} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="zone-name">Nombre de la Zona *</Label>
              <Input
                id="zone-name"
                placeholder="Ej. Noroeste Argentino (NOA)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="zone-description">Descripción (Opcional)</Label>
              <Textarea
                id="zone-description"
                placeholder="Notas aclaratorias sobre esta zona geográfica..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={1}
                className="min-h-[40px]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Territorios Integrantes *</Label>
              <Badge variant="outline" className="text-xs">
                {selectedTerritoryIds.length} {selectedTerritoryIds.length === 1 ? 'territorio seleccionado' : 'territorios seleccionados'}
              </Badge>
            </div>

            {loadingTree ? (
              <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Cargando árbol de territorios...</span>
              </div>
            ) : (
              <TerritoryTreeSelect
                tree={territoryTree}
                selectedIds={selectedTerritoryIds}
                onChange={setSelectedTerritoryIds}
              />
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-2 pt-4 border-t">
        {editingZone && (
          <Button type="button" variant="outline" onClick={handleResetForm} disabled={submitting}>
            <X className="h-4 w-4 mr-1.5" />
            Cancelar edición
          </Button>
        )}
        <Button type="submit" form="zone-form" disabled={submitting || loadingTree} className="flex items-center gap-2">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : editingZone ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {editingZone ? 'Guardar Cambios' : 'Agregar Zona'}
        </Button>
      </CardFooter>
    </Card>
  );
};
