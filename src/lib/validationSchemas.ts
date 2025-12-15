// Esquemas de validación Zod para formularios de costos
import { z } from "zod";

// ============= INSUMOS =============
export const insumoItemSchema = z.object({
  id: z.string(),
  type: z.string().min(1, "Tipo requerido"),
  producto: z.string().min(1, "Producto requerido"),
  precioUnidad: z.number().min(0.01, "Precio debe ser mayor a 0"),
  dosisMl: z.number().min(0.01, "Dosis debe ser mayor a 0").optional(),
  volumenAplicaciones: z.number().min(0.01, "Volumen debe ser mayor a 0").optional(),
  cantAplicaciones: z.number().min(1, "Cantidad debe ser mayor a 0").optional(),
  totalProducto: z.number().min(0.01, "Total debe ser mayor a 0"),
});

export const insumosFormSchema = z.object({
  type: z.literal("insumos"),
  items: z.array(insumoItemSchema).min(1, "Debe agregar al menos un ítem"),
  total: z.number().min(0.01, "Total debe ser mayor a 0"),
});

// ============= COMBUSTIBLE =============
export const combustibleDataSchema = z.object({
  valorVehiculo: z.number().min(0.01, "Valor debe ser mayor a 0"),
  c1_1_gasoilTractor: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
    precio: z.number().min(0.01, "Precio debe ser mayor a 0"),
  }),
  c1_2_mantenimientoTractor: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
  }),
  c1_3_lubricantes: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
  }),
  c2_1_nafta: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
    precio: z.number().min(0.01, "Precio debe ser mayor a 0"),
  }),
  c2_2_impuestos: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
  }),
  c2_3_seguro: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
  }),
  c2_4_mantenimientoVehiculo: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
  }),
  c3_gasoilRiego: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
    precio: z.number().min(0.01, "Precio debe ser mayor a 0"),
  }),
  c4_otros: z.object({
    cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
    precio: z.number().min(0.01, "Precio debe ser mayor a 0"),
  }),
});

export const combustibleSubtotalesSchema = z.object({
  c1_1: z.number(),
  c1_2: z.number(),
  c1_3: z.number(),
  c2_1: z.number(),
  c2_2: z.number(),
  c2_3: z.number(),
  c2_4: z.number(),
  c3: z.number(),
  c4: z.number(),
});

export const combustibleFormSchema = z.object({
  type: z.literal("combustible"),
  data: combustibleDataSchema,
  subtotales: combustibleSubtotalesSchema,
  total: z.number().min(0.01, "Total debe ser mayor a 0"),
});

// ============= MANO DE OBRA =============
export const manoObraItemSchema = z.object({
  id: z.string(),
  rol: z.string().min(1, "Rol requerido"),
  remuneracion: z.number().min(0.01, "Remuneración debe ser mayor a 0"),
  cargasSociales: z.number().min(0.01, "Cargas sociales deben ser mayor a 0"),
  nroPersonas: z.number().int().min(1, "Debe haber al menos 1 persona"),
});

export const manoObraFormSchema = z.object({
  type: z.literal("mano-obra"),
  items: z.array(manoObraItemSchema).min(1, "Debe agregar al menos un ítem"),
  total: z.number().min(0.01, "Total debe ser mayor a 0"),
});

// ============= GASTOS ADMINISTRATIVOS =============
export const staffItemSchema = z.object({
  id: z.string(),
  rol: z.string().min(1, "Rol requerido"),
  remuneracion: z.number().min(0.01, "Remuneración debe ser mayor a 0"),
  cargasSociales: z.number().min(0.01, "Cargas sociales deben ser mayor a 0"),
  nroProfesionales: z.number().int().min(1, "Debe haber al menos 1 profesional"),
});

export const gastosAdminFormSchema = z.object({
  type: z.literal("gastos-admin"),
  gastosGenerales: z.record(z.number().min(0.01, "Valor debe ser mayor a 0")),
  staff: z.array(staffItemSchema),
  totalGenerales: z.number().min(0.01, "Total debe ser mayor a 0"),
  totalStaff: z.number().min(0.01, "Total debe ser mayor a 0"),
  total: z.number().min(0.01, "Total debe ser mayor a 0"),
});

// ============= MANTENIMIENTOS =============
export const mantenimientoItemSchema = z.object({
  id: z.string(),
  nombreHerramienta: z.string().min(1, "Nombre requerido"),
  precioReparacion: z.number().min(0.01, "Precio debe ser mayor a 0"),
});

export const mantenimientosFormSchema = z.object({
  type: z.literal("mantenimientos"),
  items: z.array(mantenimientoItemSchema).min(1, "Debe agregar al menos un ítem"),
});

// ============= COSTOS DE OPORTUNIDAD =============
export const costosOportunidadFormSchema = z.object({
  type: z.literal("Arrendamiento"),
  cantidad: z.number().min(0.01, "Cantidad debe ser mayor a 0"),
  precioUnidad: z.number().min(0.01, "Precio debe ser mayor a 0"),
});

// ============= COSECHA =============
export const cosechaFormSchema = z.object({
  type: z.literal("cosecha"),
  valores: z.record(z.number().min(0.01, "Valor debe ser mayor a 0")),
  total: z.number().min(0.01, "Total debe ser mayor a 0"),
});

// ============= ENERGÍA =============
export const energiaFormSchema = z.object({
  type: z.literal("energia"),
  data: z.object({
    tipoEnergia: z.enum(["Instalaciones", "Riego"]),
    subtotalAnual: z.number().min(0.01, "Subtotal debe ser mayor a 0"),
  }),
  total: z.number().min(0.01, "Total debe ser mayor a 0"),
});

// ============= PRODUCCION =============
export const produccionPorMonteSchema = z.object({
  monteId: z.string().min(1, "Monte requerido"),
  nombre: z.string().min(1, "Nombre requerido"),
  hectareas: z.number().min(0.01, "Hectáreas deben ser mayor a 0"),
  edad: z.number().min(0, "Edad debe ser mayor o igual a 0"),
  kgRecolectados: z.number().min(0, "Kg recolectados deben ser mayor o igual a 0"),
});

export const registrarProduccionFormSchema = z.object({
  precioPromedio: z.number().min(0.01, "Precio promedio debe ser mayor a 0"),
  metodo: z.enum(["detallado", "total"]),
  pesoTotal: z.number().min(0, "Peso total debe ser mayor o igual a 0").optional(),
  montesSeleccionados: z.array(z.string()).optional(),
  produccionPorMonte: z.array(produccionPorMonteSchema).min(1, "Debe haber al menos un registro de producción"),
});

// Tipos inferidos
export type InsumoItemForm = z.infer<typeof insumoItemSchema>;
export type InsumosFormData = z.infer<typeof insumosFormSchema>;
export type CombustibleFormData = z.infer<typeof combustibleFormSchema>;
export type ManoObraFormData = z.infer<typeof manoObraFormSchema>;
export type GastosAdminFormData = z.infer<typeof gastosAdminFormSchema>;
export type MantenimientosFormData = z.infer<typeof mantenimientosFormSchema>;
export type CostosOportunidadFormData = z.infer<typeof costosOportunidadFormSchema>;
export type CosechaFormData = z.infer<typeof cosechaFormSchema>;
export type EnergiaFormData = z.infer<typeof energiaFormSchema>;
export type ProduccionPorMonteData = z.infer<typeof produccionPorMonteSchema>;
export type RegistrarProduccionFormData = z.infer<typeof registrarProduccionFormSchema>;