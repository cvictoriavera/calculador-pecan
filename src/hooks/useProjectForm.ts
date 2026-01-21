import { useState } from 'react';
import type { GeoData } from '@/types/project';

export const useProjectForm = () => {
  const [geoData, setGeoData] = useState<GeoData>({
    provinces: [],
    departments: {},
    municipalities: {},
  });

  const [isGeoDataLoading, setIsGeoDataLoading] = useState(false);

  const loadGeoDataForCountry = async (pais: string) => {
    if (pais !== "Argentina") {
      // Clear geo data if not Argentina
      setGeoData({
        provinces: [],
        departments: {},
        municipalities: {},
      });
      return;
    }

    setIsGeoDataLoading(true);
    try {
      // Dynamic import to load only when needed
      const data = await import('../../public/geo-argentina.json');

      const provincesSet = new Set<string>();
      const departmentsMap: { [province: string]: Set<string> } = {};
      const municipalitiesMap: { [key: string]: Set<string> } = {};

      data.default.localidades_censales.forEach((loc: any) => {
        const province = loc.provincia.nombre;
        const department = loc.departamento.nombre;
        const municipality = loc.nombre;

        provincesSet.add(province);

        if (!departmentsMap[province]) {
          departmentsMap[province] = new Set();
        }
        departmentsMap[province].add(department);

        const key = `${province}-${department}`;
        if (!municipalitiesMap[key]) {
          municipalitiesMap[key] = new Set();
        }
        municipalitiesMap[key].add(municipality);
      });

      const provinces = Array.from(provincesSet).sort();
      const departments: { [province: string]: string[] } = {};
      const municipalities: { [key: string]: string[] } = {};

      Object.keys(departmentsMap).forEach(prov => {
        departments[prov] = Array.from(departmentsMap[prov]).sort();
      });

      Object.keys(municipalitiesMap).forEach(key => {
        municipalities[key] = Array.from(municipalitiesMap[key]).sort();
      });

      setGeoData({
        provinces,
        departments,
        municipalities,
      });
    } catch (error) {
      console.error("Error loading geo data:", error);
    } finally {
      setIsGeoDataLoading(false);
    }
  };

  return {
    geoData,
    isGeoDataLoading,
    loadGeoDataForCountry,
  };
};