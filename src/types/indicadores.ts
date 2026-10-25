/**
 * Definiciones de tipos para el módulo de Indicadores Consolidados.
 */

export interface ProductorData {
  id: string;
  productor: string;
  finca: string;
  provincia: string;
  has: number;
  kilos: number;
  totalCostos: number;
  insumos: {
    total: number;
    suelo: number | null;
    foliares: number | null;
    fung: number | null;
    herb: number | null;
    insect: number | null;
  };
  combustible: number;
  mObra: number;
  energia: number;
  cosecha: number;
  adm: number | null;
  mant: number | null;
  meta?: {
    physicalHas?: number;
    haYearsCost?: number;
    haYearsProd?: number;
    instances?: number;
  };
}

export type CellColor = 'green' | 'yellow' | 'red' | 'neutral';

export interface FormattedRowItem {
  id: string;
  productor: string;
  finca: string;
  provincia: string;
  has: number;
  kilos: { val: number | string; color?: CellColor };
  totalCostos: { val: number | string; color?: CellColor };
  insumosTotal: { val: number | string; color?: CellColor };
  insumosSuelo: { val: number | string; color?: CellColor };
  insumosFoliares: { val: number | string; color?: CellColor };
  insumosFung: { val: number | string; color?: CellColor };
  insumosHerb: { val: number | string; color?: CellColor };
  insumosInsect: { val: number | string; color?: CellColor };
  combustible: { val: number | string; color?: CellColor };
  mObra: { val: number | string; color?: CellColor };
  energia: { val: number | string; color?: CellColor };
  cosecha: { val: number | string; color?: CellColor };
  adm: { val: number | string; color?: CellColor };
  mant: { val: number | string; color?: CellColor };
}

export type AgeBracketId = "young" | "9-11" | "custom";

export interface AgeBracketConfig {
  id: AgeBracketId;
  label: string;
  rangeLabel: string;
  badge: string;
  description: string;
  minAge: number;
  maxAge: number;
}
