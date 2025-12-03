// Cálculos centralizados para costos operativos

// ============= INSUMOS =============
export interface InsumoItem {
  id: string;
  tipo: string;
  producto: string;
  precioUnidad: number;
  dosisMl: number;
  volumenAplicaciones: number;
  cantAplicaciones: number;
  totalProducto: number;
}

export const calcularTotalProductoInsumo = (
  dosisMl: number,
  volumenAplicaciones: number,
  cantAplicaciones: number
): number => {
  return (dosisMl * volumenAplicaciones * cantAplicaciones) / 1000;
};

export const calcularCostoLineaInsumo = (precioUnidad: number, totalProducto: number): number => {
  return precioUnidad * totalProducto;
};

export const calcularTotalPorTipoInsumo = (items: InsumoItem[], tipo: string): number => {
  return items
    .filter((item) => item.tipo === tipo)
    .reduce((acc, item) => acc + calcularCostoLineaInsumo(item.precioUnidad, item.totalProducto), 0);
};

export const calcularTotalGeneralInsumos = (items: InsumoItem[]): number => {
  return items.reduce((acc, item) => acc + calcularCostoLineaInsumo(item.precioUnidad, item.totalProducto), 0);
};

// ============= COMBUSTIBLE =============
export interface CombustibleData {
  valorVehiculo: number;
  c1_1_gasoilTractor: { cantidad: number; precio: number };
  c1_2_mantenimientoTractor: { cantidad: number };
  c1_3_lubricantes: { cantidad: number };
  c2_1_nafta: { cantidad: number; precio: number };
  c2_2_impuestos: { cantidad: number };
  c2_3_seguro: { cantidad: number };
  c2_4_mantenimientoVehiculo: { cantidad: number };
  c3_gasoilRiego: { cantidad: number; precio: number };
  c4_otros: { cantidad: number; precio: number };
}

export interface CombustibleSubtotales {
  c1_1: number;
  c1_2: number;
  c1_3: number;
  c2_1: number;
  c2_2: number;
  c2_3: number;
  c2_4: number;
  c3: number;
  c4: number;
}

// Fórmula 1: cantidad * precio (C1.1, C2.1, C3, C4)
export const calcularSubtotalFormula1 = (cantidad: number, precio: number): number => {
  return cantidad * precio;
};

// Fórmula 2: cantidad * subtotal anterior (C1.2, C1.3)
export const calcularSubtotalFormula2 = (cantidad: number, subtotalAnterior: number): number => {
  return cantidad * subtotalAnterior;
};

// Fórmula 3: (cantidad * valor del vehículo) / 100 (C2.2, C2.3, C2.4)
export const calcularSubtotalFormula3 = (cantidad: number, valorVehiculo: number): number => {
  return (cantidad * valorVehiculo) / 100;
};

export const calcularSubtotalesCombustible = (data: CombustibleData): CombustibleSubtotales => {
  const c1_1 = calcularSubtotalFormula1(data.c1_1_gasoilTractor.cantidad, data.c1_1_gasoilTractor.precio);
  const c1_2 = calcularSubtotalFormula2(data.c1_2_mantenimientoTractor.cantidad, c1_1);
  const c1_3 = calcularSubtotalFormula2(data.c1_3_lubricantes.cantidad, c1_2);
  const c2_1 = calcularSubtotalFormula1(data.c2_1_nafta.cantidad, data.c2_1_nafta.precio);
  const c2_2 = calcularSubtotalFormula3(data.c2_2_impuestos.cantidad, data.valorVehiculo);
  const c2_3 = calcularSubtotalFormula3(data.c2_3_seguro.cantidad, data.valorVehiculo);
  const c2_4 = calcularSubtotalFormula3(data.c2_4_mantenimientoVehiculo.cantidad, data.valorVehiculo);
  const c3 = calcularSubtotalFormula1(data.c3_gasoilRiego.cantidad, data.c3_gasoilRiego.precio);
  const c4 = calcularSubtotalFormula1(data.c4_otros.cantidad, data.c4_otros.precio);

  return { c1_1, c1_2, c1_3, c2_1, c2_2, c2_3, c2_4, c3, c4 };
};

export const calcularTotalCombustible = (subtotales: CombustibleSubtotales): number => {
  return Object.values(subtotales).reduce((acc, val) => acc + val, 0);
};

// ============= MANO DE OBRA =============
export interface ManoObraItem {
  id: string;
  rol: string;
  remuneracion: number;
  cargasSociales: number;
  nroPersonas: number;
}

export const calcularCostoManoObra = (
  remuneracion: number,
  cargasSociales: number,
  nroPersonas: number
): number => {
  return (remuneracion + cargasSociales) * nroPersonas;
};

export const calcularTotalManoObra = (items: ManoObraItem[]): number => {
  return items.reduce((acc, item) => acc + calcularCostoManoObra(item.remuneracion, item.cargasSociales, item.nroPersonas), 0);
};

// ============= COSECHA =============
export const calcularTotalCosecha = (valores: Record<string, number>): number => {
  return Object.values(valores).reduce((acc, val) => acc + (val || 0), 0);
};

// ============= GASTOS ADMINISTRATIVOS =============
export interface StaffItem {
  id: string;
  rol: string;
  remuneracion: number;
  cargasSociales: number;
  nroProfesionales: number;
}

export const calcularCostoStaff = (
  remuneracion: number,
  cargasSociales: number,
  nroProfesionales: number
): number => {
  return (remuneracion + cargasSociales) * nroProfesionales;
};

export const calcularTotalGastosGenerales = (valores: Record<string, number>): number => {
  return Object.values(valores).reduce((acc, val) => acc + (val || 0), 0);
};

export const calcularTotalStaff = (items: StaffItem[]): number => {
  return items.reduce((acc, item) => acc + calcularCostoStaff(item.remuneracion, item.cargasSociales, item.nroProfesionales), 0);
};

// ============= MANTENIMIENTOS =============
export interface MantenimientoItem {
  id: string;
  nombreHerramienta: string;
  precioReparacion: number;
}

export const calcularTotalMantenimientos = (items: MantenimientoItem[]): number => {
  return items.reduce((acc, item) => acc + (item.precioReparacion || 0), 0);
};

// ============= COSTOS DE OPORTUNIDAD =============
export const calcularTotalOportunidad = (cantidad: number, precioUnidad: number): number => {
  return cantidad * precioUnidad;
};

// ============= FORMATEO DE MONEDA =============
export const formatCurrency = (value: number, showUSD = false): string => {
  const formatted = value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return showUSD ? `USD $${formatted}` : `$${formatted}`;
};

// ============= INVERSIONES - MAQUINARIA =============
export interface MaquinariaItem {
  id: string;
  tipo: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}

export const calcularSubtotalMaquinaria = (cantidad: number, precio: number): number => {
  return cantidad * precio;
};

export const calcularTotalMaquinaria = (items: MaquinariaItem[]): number => {
  return items.reduce((acc, item) => acc + calcularSubtotalMaquinaria(item.cantidad, item.precio), 0);
};
