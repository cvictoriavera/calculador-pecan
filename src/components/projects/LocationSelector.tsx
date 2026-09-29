import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { GeographicTerritory } from '@/types/zone';
import { getTerritories } from '@/services/zoneService';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Loader2 } from 'lucide-react';

interface LocationSelectorProps {
  countryId?: number;
  selectedTerritoryId?: number | null;
  onChange: (territoryId: number | null, localityName?: string, departmentName?: string, provinceName?: string) => void;
  disabled?: boolean;
}

export const LocationSelector = ({
  countryId,
  selectedTerritoryId: _selectedTerritoryId,
  onChange,
  disabled = false,
}: LocationSelectorProps) => {
  const { user } = useApp();
  const effectiveCountryId = countryId || user?.country_id || 1;
  const userCountryName = user?.pais || 'Argentina';

  const [provinces, setProvinces] = useState<GeographicTerritory[]>([]);
  const [departments, setDepartments] = useState<GeographicTerritory[]>([]);
  const [localities, setLocalities] = useState<GeographicTerritory[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>('');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  // 1. Cargar Provincias (Nivel 1) desde DB
  useEffect(() => {
    loadProvinces();
  }, [effectiveCountryId]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await getTerritories({
        country_id: effectiveCountryId,
        level_number: 1,
      });
      setProvinces(data);
    } catch (err) {
      console.error('Error cargando provincias:', err);
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  };

  // 2. Al cambiar Provincia, cargar Departamentos (Nivel 2) desde DB
  useEffect(() => {
    if (selectedProvinceId) {
      loadDepartments(Number(selectedProvinceId));
    } else {
      setDepartments([]);
      setSelectedDepartmentId('');
      setLocalities([]);
      setSelectedLocalityId('');
    }
  }, [selectedProvinceId]);

  const loadDepartments = async (provId: number) => {
    setLoadingDepartments(true);
    try {
      const data = await getTerritories({
        country_id: effectiveCountryId,
        parent_id: provId,
      });
      setDepartments(data);
    } catch (err) {
      console.error('Error cargando departamentos:', err);
      setDepartments([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // 3. Al cambiar Departamento, cargar Localidades / Municipios (Nivel 3) desde DB
  useEffect(() => {
    if (selectedDepartmentId) {
      loadLocalities(Number(selectedDepartmentId));
    } else {
      setLocalities([]);
      setSelectedLocalityId('');
    }
  }, [selectedDepartmentId]);

  const loadLocalities = async (deptId: number) => {
    setLoadingLocalities(true);
    try {
      const data = await getTerritories({
        country_id: effectiveCountryId,
        parent_id: deptId,
      });
      setLocalities(data);
    } catch (err) {
      console.error('Error cargando localidades:', err);
      setLocalities([]);
    } finally {
      setLoadingLocalities(false);
    }
  };

  const handleProvinceChange = (val: string) => {
    setSelectedProvinceId(val);
    setSelectedDepartmentId('');
    setSelectedLocalityId('');

    const provObj = provinces.find((p) => String(p.id) === val);
    if (provObj) {
      onChange(provObj.id, '', '', provObj.name);
    } else {
      onChange(null);
    }
  };

  const handleDepartmentChange = (val: string) => {
    setSelectedDepartmentId(val);
    setSelectedLocalityId('');

    const deptObj = departments.find((d) => String(d.id) === val);
    const provObj = provinces.find((p) => String(p.id) === selectedProvinceId);

    if (deptObj) {
      onChange(deptObj.id, '', deptObj.name, provObj?.name);
    } else if (provObj) {
      onChange(provObj.id, '', '', provObj.name);
    }
  };

  const handleLocalityChange = (val: string) => {
    setSelectedLocalityId(val);

    const locObj = localities.find((l) => String(l.id) === val);
    const deptObj = departments.find((d) => String(d.id) === selectedDepartmentId);
    const provObj = provinces.find((p) => String(p.id) === selectedProvinceId);

    if (locObj) {
      onChange(locObj.id, locObj.name, deptObj?.name, provObj?.name);
    } else if (deptObj) {
      onChange(deptObj.id, '', deptObj.name, provObj?.name);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/20 border border-border/60 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Ubicación Geográfica del Proyecto
        </span>

        {/* Campo de País Inmutable fijado del perfil ACF del usuario */}
        <Badge variant="outline" className="text-xs flex items-center gap-1 bg-background px-3 py-1">
          <Globe className="h-3.5 w-3.5 text-primary" />
          País: <strong className="font-semibold text-foreground ml-1">{userCountryName}</strong>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Provincia */}
        <div className="space-y-1.5">
          <Label htmlFor="select-province" className="text-xs font-medium">
            Provincia / Estado *
          </Label>
          {loadingProvinces ? (
            <div className="flex items-center gap-2 p-2 border rounded text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Cargando provincias...
            </div>
          ) : (
            <Select
              value={selectedProvinceId}
              onValueChange={handleProvinceChange}
              disabled={disabled}
            >
              <SelectTrigger id="select-province" className="h-9 text-xs">
                <SelectValue placeholder="Seleccionar Provincia" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {provinces.map((prov) => (
                  <SelectItem key={prov.id} value={String(prov.id)} className="text-xs">
                    {prov.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Departamento */}
        <div className="space-y-1.5">
          <Label htmlFor="select-department" className="text-xs font-medium">
            Departamento / Partido *
          </Label>
          {loadingDepartments ? (
            <div className="flex items-center gap-2 p-2 border rounded text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Cargando departamentos...
            </div>
          ) : (
            <Select
              value={selectedDepartmentId}
              onValueChange={handleDepartmentChange}
              disabled={disabled || !selectedProvinceId}
            >
              <SelectTrigger id="select-department" className="h-9 text-xs">
                <SelectValue placeholder={selectedProvinceId ? 'Seleccionar Departamento' : 'Primero elige Provincia'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)} className="text-xs">
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Municipio / Localidad */}
        <div className="space-y-1.5">
          <Label htmlFor="select-locality" className="text-xs font-medium">
            Municipio / Localidad (Opcional)
          </Label>
          {loadingLocalities ? (
            <div className="flex items-center gap-2 p-2 border rounded text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Cargando localidades...
            </div>
          ) : (
            <Select
              value={selectedLocalityId}
              onValueChange={handleLocalityChange}
              disabled={disabled || !selectedDepartmentId}
            >
              <SelectTrigger id="select-locality" className="h-9 text-xs">
                <SelectValue placeholder={selectedDepartmentId ? (localities.length > 0 ? 'Seleccionar Localidad' : 'Sin localidades registradas') : 'Primero elige Departamento'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {localities.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)} className="text-xs">
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};
