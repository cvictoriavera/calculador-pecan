import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { GeographicZone, Country } from '@/types/zone';
import { getZones, getCountries, deleteZone } from '@/services/zoneService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Building2, Users, Layers, Edit, Trash2, Globe, RefreshCw } from 'lucide-react';
import { ZoneFormCard } from './ZoneFormCard';

export const GeographicZonesManager = () => {
  const { user } = useApp();
  const [zones, setZones] = useState<GeographicZone[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingZone, setEditingZone] = useState<GeographicZone | null>(null);

  const isSuperAdmin = user?.roles?.includes('administrator') || user?.roles?.includes('admin');
  const userCountryName = user?.pais || 'Argentina';

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountryId) {
      loadZones();
    }
  }, [selectedCountryId]);

  const loadCountries = async () => {
    try {
      const data = await getCountries();
      setCountries(data);

      // Si el usuario tiene un country_id asignado, fijarlo
      if (user?.country_id) {
        setSelectedCountryId(user.country_id);
      } else if (data.length > 0) {
        const found = data.find((c) => c.name.toLowerCase() === userCountryName.toLowerCase());
        if (found) {
          setSelectedCountryId(found.id);
        } else {
          setSelectedCountryId(data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error cargando países:', err);
    }
  };

  const loadZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getZones(selectedCountryId);
      setZones(data || []);
    } catch (err: any) {
      console.error('Error cargando zonas:', err);
      setError(err?.message || 'No se pudieron cargar las zonas geográficas.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zone: GeographicZone) => {
    setEditingZone(zone);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingZone(null);
  };

  const handleDelete = async (zone: GeographicZone) => {
    if (!window.confirm(`¿Estás seguro de desactivar la zona "${zone.name}"?`)) {
      return;
    }

    try {
      await deleteZone(zone.id);
      loadZones();
    } catch (err: any) {
      console.error('Error desactivando zona:', err);
      alert('Ocurrió un error al desactivar la zona.');
    }
  };

  const currentCountryObj = countries.find((c) => c.id === selectedCountryId);
  const currentCountryName = currentCountryObj?.name || userCountryName;

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Gestión de Zonas Geográficas</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Zonificación estadística territorial para segmentación y benchmarking del cultivo de pecán.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Badge del País Inmutable del Usuario */}
          <Badge variant="outline" className="bg-background py-1.5 px-3 border-primary/30 text-sm flex items-center gap-2 shadow-sm">
            <Globe className="h-4 w-4 text-primary" />
            <span>País: <strong className="font-semibold text-foreground">{currentCountryName}</strong></span>
          </Badge>

          {/* Selector de país visible solo para Super Administrador */}
          {isSuperAdmin && countries.length > 1 && (
            <select
              value={selectedCountryId}
              onChange={(e) => setSelectedCountryId(Number(e.target.value))}
              className="text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  Ver {c.name}
                </option>
              ))}
            </select>
          )}

          <Button variant="outline" size="sm" onClick={loadZones} disabled={loading} className="flex items-center gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Formulario Inline de Creación / Edición de Zonas */}
      <ZoneFormCard
        onSuccess={loadZones}
        editingZone={editingZone}
        onCancelEdit={handleCancelEdit}
        userCountryId={selectedCountryId}
        userCountryName={currentCountryName}
      />

      {/* Main Table Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-8 text-center text-destructive">
            <p className="font-semibold mb-1">Error al cargar zonas</p>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Zonas registradas en {currentCountryName}
                <Badge variant="secondary" className="ml-2">
                  {zones.length} {zones.length === 1 ? 'zona' : 'zonas'}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-0.5">
                Los proyectos se asignan automáticamente a estas zonas según su departamento/provincia.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {zones.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">
                  No hay zonas geográficas creadas en {currentCountryName}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Utiliza el formulario superior para crear la primera zona definiendo los territorios pertenecientes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <th className="p-3">ID</th>
                      <th className="p-3">Nombre de la Zona</th>
                      <th className="p-3">Territorios Integrantes</th>
                      <th className="p-3 text-right">Proyectos</th>
                      <th className="p-3 text-right">Productores</th>
                      <th className="p-3 text-right">Hectáreas</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {zones.map((zone) => (
                      <tr key={zone.id} className="hover:bg-accent/20 transition-colors">
                        <td className="p-3 font-mono text-xs font-semibold text-muted-foreground">
                          #{zone.id}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-foreground">{zone.name}</div>
                          {zone.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{zone.description}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                            <Layers className="h-3 w-3 text-primary" />
                            {zone.territories_count} {zone.territories_count === 1 ? 'territorio' : 'territorios'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-medium">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {zone.projects_count || 0}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {zone.producers_count || 0}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium text-foreground">
                          {zone.registered_hectares ? zone.registered_hectares.toLocaleString('es-AR') : '0'} ha
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(zone)}
                              title="Editar zona"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(zone)}
                              title="Desactivar zona"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
};
