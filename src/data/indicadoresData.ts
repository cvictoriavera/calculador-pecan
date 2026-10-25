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

// Filtros específicos solicitados: solo 1 a 5 años, 9 a 11 años y personalizado
export const AGE_BRACKETS_CONFIG: AgeBracketConfig[] = [
  {
    id: "young",
    label: "1 a 5 años",
    rangeLabel: "1 a 5 años",
    badge: "Formación",
    description: "Montes en desarrollo vegetativo temprano sin cosecha comercial aún.",
    minAge: 1,
    maxAge: 5,
  },
  {
    id: "9-11",
    label: "9 a 11 años",
    rangeLabel: "9 a 11 años",
    badge: "Producción media",
    description: "Evaluación sobre montes en entrada a producción media.",
    minAge: 9,
    maxAge: 11,
  },
  {
    id: "custom",
    label: "Personalizado...",
    rangeLabel: "Rango a medida",
    badge: "Personalizado",
    description: "Definir un rango de edad específico para evaluar la cohorte histórica.",
    minAge: 1,
    maxAge: 40,
  },
];

// -------------------------------------------------------------
// CÁLCULO DINÁMICO DE TOTALES Y PROMEDIOS
// -------------------------------------------------------------
export function calculateTotals(producers: ProductorData[]): {
  totalGeneral: ProductorData;
  totalPorHa: FormattedRowItem;
  totalPorKilo: FormattedRowItem;
} {
  const totalGeneral: ProductorData = {
    id: "total",
    productor: "TOTAL",
    finca: "",
    provincia: "",
    has: Number(producers.reduce((sum, p) => sum + p.has, 0).toFixed(1)),
    kilos: producers.reduce((sum, p) => sum + p.kilos, 0),
    totalCostos: producers.reduce((sum, p) => sum + p.totalCostos, 0),
    insumos: {
      total: producers.reduce((sum, p) => sum + (p.insumos.total || 0), 0),
      suelo: producers.reduce((sum, p) => sum + (p.insumos.suelo || 0), 0),
      foliares: producers.reduce((sum, p) => sum + (p.insumos.foliares || 0), 0),
      fung: producers.reduce((sum, p) => sum + (p.insumos.fung || 0), 0),
      herb: producers.reduce((sum, p) => sum + (p.insumos.herb || 0), 0),
      insect: producers.reduce((sum, p) => sum + (p.insumos.insect || 0), 0),
    },
    combustible: producers.reduce((sum, p) => sum + p.combustible, 0),
    mObra: producers.reduce((sum, p) => sum + p.mObra, 0),
    energia: producers.reduce((sum, p) => sum + p.energia, 0),
    cosecha: producers.reduce((sum, p) => sum + p.cosecha, 0),
    adm: producers.reduce((sum, p) => sum + (p.adm || 0), 0),
    mant: producers.reduce((sum, p) => sum + (p.mant || 0), 0),
  };

  const has = totalGeneral.has > 0 ? totalGeneral.has : 0;
  const kilos = totalGeneral.kilos > 0 ? totalGeneral.kilos : 0;

  const totalPorHa: FormattedRowItem = {
    id: "total",
    productor: "TOTAL",
    finca: "",
    provincia: "",
    has: totalGeneral.has,
    kilos: { val: has > 0 ? Math.round(totalGeneral.kilos / has) : 0, color: 'neutral' },
    totalCostos: { val: has > 0 ? Math.round(totalGeneral.totalCostos / has) : 0, color: 'neutral' },
    insumosTotal: { val: has > 0 ? Math.round(totalGeneral.insumos.total / has) : 0, color: 'neutral' },
    insumosSuelo: { val: has > 0 && totalGeneral.insumos.suelo ? Math.round(totalGeneral.insumos.suelo / has) : "-", color: 'neutral' },
    insumosFoliares: { val: has > 0 && totalGeneral.insumos.foliares ? Math.round(totalGeneral.insumos.foliares / has) : "-", color: 'neutral' },
    insumosFung: { val: has > 0 && totalGeneral.insumos.fung ? Math.round(totalGeneral.insumos.fung / has) : "-", color: 'neutral' },
    insumosHerb: { val: (totalGeneral.insumos.herb || 0) > 0 ? Math.round((totalGeneral.insumos.herb || 0) / has) : "-", color: 'neutral' },
    insumosInsect: { val: has > 0 && totalGeneral.insumos.insect ? Math.round(totalGeneral.insumos.insect / has) : "-", color: 'neutral' },
    combustible: { val: has > 0 ? Math.round(totalGeneral.combustible / has) : 0, color: 'neutral' },
    mObra: { val: has > 0 ? Math.round(totalGeneral.mObra / has) : 0, color: 'neutral' },
    energia: { val: has > 0 ? Math.round(totalGeneral.energia / has) : 0, color: 'neutral' },
    cosecha: { val: has > 0 ? Math.round(totalGeneral.cosecha / has) : 0, color: 'neutral' },
    adm: { val: has > 0 && totalGeneral.adm ? Math.round(totalGeneral.adm / has) : "-", color: 'neutral' },
    mant: { val: has > 0 && totalGeneral.mant ? Math.round(totalGeneral.mant / has) : "-", color: 'neutral' },
  };

  const totalPorKilo: FormattedRowItem = {
    id: "total",
    productor: "TOTAL",
    finca: "",
    provincia: "",
    has: 0,
    kilos: { val: totalGeneral.kilos, color: 'neutral' },
    totalCostos: { val: kilos > 0 ? Number((totalGeneral.totalCostos / kilos).toFixed(2)) : "-", color: 'neutral' },
    insumosTotal: { val: kilos > 0 ? Number((totalGeneral.insumos.total / kilos).toFixed(2)) : "-", color: 'neutral' },
    insumosSuelo: { val: kilos > 0 && totalGeneral.insumos.suelo ? Number((totalGeneral.insumos.suelo / kilos).toFixed(2)) : "-", color: 'neutral' },
    insumosFoliares: { val: kilos > 0 && totalGeneral.insumos.foliares ? Number((totalGeneral.insumos.foliares / kilos).toFixed(2)) : "-", color: 'neutral' },
    insumosFung: { val: kilos > 0 && totalGeneral.insumos.fung ? Number((totalGeneral.insumos.fung / kilos).toFixed(2)) : "-", color: 'neutral' },
    insumosHerb: { val: kilos > 0 && totalGeneral.insumos.herb ? Number((totalGeneral.insumos.herb / kilos).toFixed(2)) : "-", color: 'neutral' },
    insumosInsect: { val: kilos > 0 && totalGeneral.insumos.insect ? Number((totalGeneral.insumos.insect / kilos).toFixed(2)) : "-", color: 'neutral' },
    combustible: { val: kilos > 0 ? Number((totalGeneral.combustible / kilos).toFixed(2)) : "-", color: 'neutral' },
    mObra: { val: kilos > 0 ? Number((totalGeneral.mObra / kilos).toFixed(2)) : "-", color: 'neutral' },
    energia: { val: kilos > 0 ? Number((totalGeneral.energia / kilos).toFixed(2)) : "-", color: 'neutral' },
    cosecha: { val: kilos > 0 ? Number((totalGeneral.cosecha / kilos).toFixed(2)) : "-", color: 'neutral' },
    adm: { val: kilos > 0 && totalGeneral.adm ? Number((totalGeneral.adm / kilos).toFixed(2)) : "-", color: 'neutral' },
    mant: { val: kilos > 0 && totalGeneral.mant ? Number((totalGeneral.mant / kilos).toFixed(2)) : "-", color: 'neutral' },
  };

  return { totalGeneral, totalPorHa, totalPorKilo };
}

// Helper para determinar color semafórico comparando con la media del grupo
export function getCostColor(
  val: number | null | undefined,
  avg: number,
  higherIsBetter = false
): CellColor {
  if (val === null || val === undefined || isNaN(val) || val === 0) {
    return 'neutral';
  }
  if (!avg || avg <= 0) return 'neutral';

  const ratio = val / avg;

  if (higherIsBetter) {
    // Para rendimientos (Kilos/Ha)
    if (ratio >= 1.08) return 'green';
    if (ratio <= 0.88) return 'red';
    return 'yellow';
  } else {
    // Para costos operativos (menos es mejor)
    if (ratio <= 0.90) return 'green';
    if (ratio >= 1.10) return 'red';
    return 'yellow';
  }
}

// -------------------------------------------------------------
// DYNAMIC ROW GENERATION: POR HECTÁREA (HA)
// -------------------------------------------------------------
export function calculateTablaPorHa(
  producers: ProductorData[],
  totalGeneral: ProductorData
): FormattedRowItem[] {
  const avgHas = totalGeneral.has > 0 ? totalGeneral.has : 1;
  const avgKilos = totalGeneral.kilos / avgHas;
  const avgTotalCostos = totalGeneral.totalCostos / avgHas;
  const avgInsumosTotal = totalGeneral.insumos.total / avgHas;
  const avgInsumosSuelo = (totalGeneral.insumos.suelo || 0) / avgHas;
  const avgInsumosFoliares = (totalGeneral.insumos.foliares || 0) / avgHas;
  const avgInsumosFung = (totalGeneral.insumos.fung || 0) / avgHas;
  const avgInsumosInsect = (totalGeneral.insumos.insect || 0) / avgHas;
  const avgCombustible = totalGeneral.combustible / avgHas;
  const avgMObra = totalGeneral.mObra / avgHas;
  const avgEnergia = totalGeneral.energia / avgHas;
  const avgCosecha = totalGeneral.cosecha / avgHas;
  const avgAdm = (totalGeneral.adm || 0) / avgHas;
  const avgMant = (totalGeneral.mant || 0) / avgHas;

  return producers.map((p) => {
    const has = p.has > 0 ? p.has : 1;
    const kilosVal = Math.round(p.kilos / has);
    const totalCostosVal = Math.round(p.totalCostos / has);
    const insumosTotalVal = Math.round(p.insumos.total / has);
    const insumosSueloVal = p.insumos.suelo !== null && p.insumos.suelo > 0 ? Math.round(p.insumos.suelo / has) : null;
    const insumosFoliaresVal = p.insumos.foliares !== null && p.insumos.foliares > 0 ? Math.round(p.insumos.foliares / has) : null;
    const insumosFungVal = p.insumos.fung !== null && p.insumos.fung > 0 ? Math.round(p.insumos.fung / has) : null;
    const insumosHerbVal = p.insumos.herb !== null && p.insumos.herb > 0 ? Math.round(p.insumos.herb / has) : null;
    const insumosInsectVal = p.insumos.insect !== null && p.insumos.insect > 0 ? Math.round(p.insumos.insect / has) : null;
    const combustibleVal = Math.round(p.combustible / has);
    const mObraVal = Math.round(p.mObra / has);
    const energiaVal = Math.round(p.energia / has);
    const cosechaVal = Math.round(p.cosecha / has);
    const admVal = p.adm !== null && p.adm > 0 ? Math.round(p.adm / has) : null;
    const mantVal = p.mant !== null && p.mant > 0 ? Math.round(p.mant / has) : null;

    return {
      id: p.id,
      productor: p.productor,
      finca: p.finca,
      provincia: p.provincia,
      has: p.has,
      kilos: { val: kilosVal, color: getCostColor(kilosVal, avgKilos, true) },
      totalCostos: { val: totalCostosVal, color: getCostColor(totalCostosVal, avgTotalCostos, false) },
      insumosTotal: { val: insumosTotalVal, color: getCostColor(insumosTotalVal, avgInsumosTotal, false) },
      insumosSuelo: {
        val: insumosSueloVal !== null ? insumosSueloVal : "-",
        color: insumosSueloVal !== null ? getCostColor(insumosSueloVal, avgInsumosSuelo, false) : 'green',
      },
      insumosFoliares: {
        val: insumosFoliaresVal !== null ? insumosFoliaresVal : "-",
        color: insumosFoliaresVal !== null ? getCostColor(insumosFoliaresVal, avgInsumosFoliares, false) : 'green',
      },
      insumosFung: {
        val: insumosFungVal !== null ? insumosFungVal : "-",
        color: insumosFungVal !== null ? getCostColor(insumosFungVal, avgInsumosFung, false) : 'yellow',
      },
      insumosHerb: {
        val: insumosHerbVal !== null ? insumosHerbVal : "-",
        color: 'yellow',
      },
      insumosInsect: {
        val: insumosInsectVal !== null ? insumosInsectVal : "-",
        color: insumosInsectVal !== null ? getCostColor(insumosInsectVal, avgInsumosInsect, false) : 'green',
      },
      combustible: { val: combustibleVal, color: getCostColor(combustibleVal, avgCombustible, false) },
      mObra: { val: mObraVal, color: getCostColor(mObraVal, avgMObra, false) },
      energia: { val: energiaVal, color: getCostColor(energiaVal, avgEnergia, false) },
      cosecha: { val: cosechaVal, color: getCostColor(cosechaVal, avgCosecha, false) },
      adm: {
        val: admVal !== null ? admVal : "-",
        color: admVal !== null ? getCostColor(admVal, avgAdm, false) : 'green',
      },
      mant: {
        val: mantVal !== null ? mantVal : "-",
        color: mantVal !== null ? getCostColor(mantVal, avgMant, false) : 'green',
      },
    };
  });
}

// -------------------------------------------------------------
// DYNAMIC ROW GENERATION: POR KILO (KG)
// -------------------------------------------------------------
export function calculateTablaPorKilo(
  producers: ProductorData[],
  totalGeneral: ProductorData
): FormattedRowItem[] {
  const avgKilos = totalGeneral.kilos > 0 ? totalGeneral.kilos : 1;
  const avgTotalCostos = totalGeneral.totalCostos / avgKilos;
  const avgInsumosTotal = totalGeneral.insumos.total / avgKilos;
  const avgInsumosSuelo = (totalGeneral.insumos.suelo || 0) / avgKilos;
  const avgInsumosFoliares = (totalGeneral.insumos.foliares || 0) / avgKilos;
  const avgInsumosFung = (totalGeneral.insumos.fung || 0) / avgKilos;
  const avgInsumosInsect = (totalGeneral.insumos.insect || 0) / avgKilos;
  const avgCombustible = totalGeneral.combustible / avgKilos;
  const avgMObra = totalGeneral.mObra / avgKilos;
  const avgEnergia = totalGeneral.energia / avgKilos;
  const avgCosecha = totalGeneral.cosecha / avgKilos;
  const avgAdm = (totalGeneral.adm || 0) / avgKilos;
  const avgMant = (totalGeneral.mant || 0) / avgKilos;

  return producers.map((p) => {
    const kilos = p.kilos;
    if (kilos <= 0) {
      return {
        id: p.id,
        productor: p.productor,
        finca: p.finca,
        provincia: p.provincia,
        has: p.has,
        kilos: { val: 0, color: 'neutral' },
        totalCostos: { val: "-", color: 'neutral' },
        insumosTotal: { val: "-", color: 'neutral' },
        insumosSuelo: { val: "-", color: 'neutral' },
        insumosFoliares: { val: "-", color: 'neutral' },
        insumosFung: { val: "-", color: 'neutral' },
        insumosHerb: { val: "-", color: 'neutral' },
        insumosInsect: { val: "-", color: 'neutral' },
        combustible: { val: "-", color: 'neutral' },
        mObra: { val: "-", color: 'neutral' },
        energia: { val: "-", color: 'neutral' },
        cosecha: { val: "-", color: 'neutral' },
        adm: { val: "-", color: 'neutral' },
        mant: { val: "-", color: 'neutral' },
      };
    }

    const totalCostosKg = Number((p.totalCostos / kilos).toFixed(2));
    const insumosTotalKg = Number((p.insumos.total / kilos).toFixed(2));
    const insumosSueloKg = p.insumos.suelo !== null && p.insumos.suelo > 0 ? Number((p.insumos.suelo / kilos).toFixed(2)) : null;
    const insumosFoliaresKg = p.insumos.foliares !== null && p.insumos.foliares > 0 ? Number((p.insumos.foliares / kilos).toFixed(2)) : null;
    const insumosFungKg = p.insumos.fung !== null && p.insumos.fung > 0 ? Number((p.insumos.fung / kilos).toFixed(2)) : null;
    const insumosHerbKg = p.insumos.herb !== null && p.insumos.herb > 0 ? Number((p.insumos.herb / kilos).toFixed(2)) : null;
    const insumosInsectKg = p.insumos.insect !== null && p.insumos.insect > 0 ? Number((p.insumos.insect / kilos).toFixed(2)) : null;
    const combustibleKg = Number((p.combustible / kilos).toFixed(2));
    const mObraKg = Number((p.mObra / kilos).toFixed(2));
    const energiaKg = Number((p.energia / kilos).toFixed(2));
    const cosechaKg = Number((p.cosecha / kilos).toFixed(2));
    const admKg = p.adm !== null && p.adm > 0 ? Number((p.adm / kilos).toFixed(2)) : null;
    const mantKg = p.mant !== null && p.mant > 0 ? Number((p.mant / kilos).toFixed(2)) : null;

    return {
      id: p.id,
      productor: p.productor,
      finca: p.finca,
      provincia: p.provincia,
      has: p.has,
      kilos: { val: p.kilos, color: 'neutral' },
      totalCostos: { val: totalCostosKg, color: getCostColor(totalCostosKg, avgTotalCostos, false) },
      insumosTotal: { val: insumosTotalKg, color: getCostColor(insumosTotalKg, avgInsumosTotal, false) },
      insumosSuelo: {
        val: insumosSueloKg !== null ? insumosSueloKg : "-",
        color: insumosSueloKg !== null ? getCostColor(insumosSueloKg, avgInsumosSuelo, false) : 'green',
      },
      insumosFoliares: {
        val: insumosFoliaresKg !== null ? insumosFoliaresKg : "-",
        color: insumosFoliaresKg !== null ? getCostColor(insumosFoliaresKg, avgInsumosFoliares, false) : 'green',
      },
      insumosFung: {
        val: insumosFungKg !== null ? insumosFungKg : "-",
        color: insumosFungKg !== null ? getCostColor(insumosFungKg, avgInsumosFung, false) : 'green',
      },
      insumosHerb: {
        val: insumosHerbKg !== null ? insumosHerbKg : "-",
        color: 'yellow',
      },
      insumosInsect: {
        val: insumosInsectKg !== null ? insumosInsectKg : "-",
        color: insumosInsectKg !== null ? getCostColor(insumosInsectKg, avgInsumosInsect, false) : 'green',
      },
      combustible: { val: combustibleKg, color: getCostColor(combustibleKg, avgCombustible, false) },
      mObra: { val: mObraKg, color: getCostColor(mObraKg, avgMObra, false) },
      energia: { val: energiaKg, color: getCostColor(energiaKg, avgEnergia, false) },
      cosecha: { val: cosechaKg, color: getCostColor(cosechaKg, avgCosecha, false) },
      adm: {
        val: admKg !== null ? admKg : "-",
        color: admKg !== null ? getCostColor(admKg, avgAdm, false) : 'green',
      },
      mant: {
        val: mantKg !== null ? mantKg : "-",
        color: mantKg !== null ? getCostColor(mantKg, avgMant, false) : 'green',
      },
    };
  });
}

// -------------------------------------------------------------
// VALORES POR DEFECTO / COMPATIBILIDAD
// -------------------------------------------------------------
export const PRODUCTORES_TOTALES: ProductorData[] = [];
const defaultTotals = calculateTotals([]);
export const TOTAL_GENERAL: ProductorData = defaultTotals.totalGeneral;
export const TOTAL_POR_HA: FormattedRowItem = defaultTotals.totalPorHa;
export const TOTAL_POR_KILO: FormattedRowItem = defaultTotals.totalPorKilo;
export const TABLA_POR_HA: FormattedRowItem[] = [];
export const TABLA_POR_KILO: FormattedRowItem[] = [];
