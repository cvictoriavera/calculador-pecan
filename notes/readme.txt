COMBUSTIBLE

1. El Concepto: Un registro por "Carga"
En tu base de datos wp_pecan_costs, la columna category siempre será 'combustibles', pero dentro del JSON details agregarás una propiedad clave: subtype.

El flujo en el Dashboard:

Listado con botones -> [Tractores, Vehículos, Riego, Otros].

Formulario Dinámico: Renderiza el componente específico según la selección.

Guardado: Crea una nueva fila en la DB.

Esto permite que en una campaña tengas 1 fila para tractores y 1 (o varias) para vehículos.



2. Estructuras de JSON según la selección
Aquí es donde entra la "magia" del campo details (LONGTEXT/JSON). No tiene que ser igual siempre.

A. Si el usuario elige: "Vehículos / Rodados"
Aquí resolvemos lo de los múltiples vehículos. Necesitas saber el valor total de la flota para calcular impuestos (3%), seguro (3%) y mantenimiento (10%).

// details para subtype: "vehicles"
{
  "subtype": "vehicles",
  "version": "1.0",
  "data": {
    // 1. Array para manejar múltiples vehículos y obtener el "Valor Fiscal Total"
    "fleet_list": [
      { "name": "Toyota Hilux", "value": 25000 },
      { "name": "Ford F-100", "value": 8000 }
    ],
    "total_fleet_value": 33000, // Suma automática (Base para cálculos)

    // 2. Inputs directos (lo que el usuario tipea)
    "fuel_liters": 1200,
    "fuel_price": 1.20,
    
    // 3. Parámetros configurables (con defaults del Excel)
    "params": {
      "tax_pct": 3,          // Aplica sobre total_fleet_value (el usuario puede cambiar este valor que se carga por defecto el 3%)
      "insurance_pct": 3,    // Aplica sobre total_fleet_value (el usuario puede cambiar este valor que se carga por defecto el 3%)
      "maint_pct": 10        // Aplica sobre total_fleet_value (el usuario puede cambiar este valor que se carga por defecto el 10%)
    }
  },
  // 4. Desglose calculado para mostrar en reportes sin recalcular
  "breakdown": {
    "fuel_cost": 1440.00,
    "tax_cost": 990.00,      // 33000 * 0.03 
    "insurance_cost": 990.00,// 33000 * 0.03
    "maint_cost": 3300.00    // 33000 * 0.10
  }
}

Total a guardar en total_amount: $6,720.00


B. Si el usuario elige: "Maquinaria / Tractores"
Este formulario es distinto. El mantenimiento depende del combustible, NO del valor del tractor.

// details para subtype: "machinery"
{
  "subtype": "machinery",
  "data": {
    "fuel_liters": 25000,
    "fuel_price": 1.04,
    "params": {
      "maint_pct_of_fuel": 20,      // 20% del gasto en gasoil (el usuario puede cambiar este valor que se carga por defecto el 20%)
      "lubricant_pct_of_maint": 15  // 15% del gasto en mantenimiento (el usuario puede cambiar este valor que se carga por defecto el 15%)
    }
  },
  "breakdown": {
    "fuel_cost": 26000.00,
    "maint_cost": 5200.00,   // 26000 * 0.20
    "lubricant_cost": 780.00 // 5200 * 0.15
  }
}

Total a guardar en total_amount: $31,980.00


C. Para los casos de Gasoil para riego y otros el formulario es el mismo y se van a guardar los campos de cantidad de litros y el precio  


MANO DE OBRA

1. Estructura del JSON
El JSON debe separar la lista de roles (donde está la carga pesada de datos) de los ajustes globales (horas extras y gastos varios).

JSON

{
  "category": "mano-obra",
  "details": {
    "type": "labor_monthly",
    "data": {
      "staff_list": [
        {
          "id": "staff_1234567890_abc123",
          "role": "Ing. Agrónomo",
          "salary_base": 1400.00,
          "social_tax_pct": 0,
          "people_count": 1,
          "apply_aguinaldo": 700
        },
        {
          "id": "staff_1234567891_def456", 
          "role": "Encargado",
          "salary_base": 540.00,
          "social_tax_pct": 30,
          "people_count": 1,
          "apply_aguinaldo": 250
        },
        {
          "id": "staff_1234567892_ghi789",
          "role": "Peón rural",
          "salary_base": 344.00,
          "social_tax_pct": 30,
          "people_count": 3,
          "apply_aguinaldo": 150
        }
      ],
      "globals": {
        "overtime_monthly_est": 306.54,
        "personnel_expenses_yearly": 2600.00
      }
    },
    "breakdown": {
      "total_monthly_payroll": 4197.34,
      "total_annual_gross": 52968.08
    }
  },
  "total_amount": 52968.08
}



ENERGIA ELECTRICA:  solo 2 tipos instalaciones o riego



COSECHA Y POS COSECHA

1. Estructura del JSON (details)

{
  "type": "harvest_variable",  
  "items": [
      {
        "id": "harvest_machinery",
        "label": "Cosecha (maquinaria)",
        "unit_price": 1200.00  // unidad U$D/kg
      },
      {
        "id": "harvest_labor",
        "label": "Cosecha (Mano de obra)",
        "unit_price": 1450.00 // unidad U$D/kg
      },
      {
        "id": "cleaning_machinery",
        "label": "Limpieza (Maquinaria)",
        "unit_price": 1205.00 // unidad U$D/kg
      },
      {
        "id": "cleaning_labor",
        "label": "Limpieza (Mano de obra)",
        "unit_price": 1780.00 // unidad U$D/kg
      },
      {
        "id": "outsourced_harvest",
        "label": "Cosecha tercerizada",
        "unit_price": 0.70 // unidad U$D/kg
      },
      {
        "id": "drying_storage",
        "label": "Secado, clasificación y almacenaje",
        "unit_price": 0.20 // unidad U$D/kg
      }
      {
        "id": "transport",
        "label": "Transporte nacional e internacional",
        "unit_price": 0.20 // unidad U$D/kg
      }
    ],
  "breakdown": {
    // Aquí guardamos los resultados de (unit_price * used_productivity)
    "subtotals": {
      "harvest_machinery": 2542000.00,
      "harvest_labor": 3071583.33,
      // ... resto de items
      "transport": 423.67
    },
    "total_harvest_cost": 11939138.50
  }
}

Nota: used_productivity es un valor que se calcula en otra pagina del Dashboard y es referenciada por el formulario de cosecha.


GASTOS ADMINISTRATIVOS json cost_data

{
  "type": "Gastos Generales",
  "data": {  
    "general_expenses": [
      {
        "id": "item_1",
        "description": "Contador",
        "input_value": 55.00,
      },
      {
        "id": "item_2",
        "description": "Software de gestión",
        "input_value": 10.00,
      },
      {
        "id": "item_3",
        "description": "Asociación productores",
        "input_value": 45.00,
      }
      // Se pueden agregar n filas dinámicamente
    ],
  },
}

{
  "type": "Staff Administrativo",
  "data": {  
    "admin_staff": [
      {
        "role": "Gerente general",
        "base_salary": 1500.00,
        "social_tax_pct": 0,
        "count": 1
      },
      {
        "role": "Secretaria",
        "base_salary": 340.00,
        "social_tax_pct": 30,
        "count": 1
      },
      {
        "role": "Consultoría Técnica (monte)",
        "base_salary": 1000.00,
      },
      {
        "role": "Consultoría Jurídica",
        "base_salary": 500.00,
      }
    ]
  },
}

MANTENIMIENTOS

{
  "type": "Herramientas",
  items[
    {
      "name": "Podadora eléctrica",
      "repair_cost": 150,
    }
    {
      "name": "Herramienta 2",
      "repair_cost": 120,
    }    
  ]
}

insumos

{
    "type": "Fertilizantes foliares",
    items: [
        {
            "product": "calcio",
            "unit_price": 3.99,
            "quantity_used": 250,
            "application_dose_ml": 500,
            "application_volume_l": 200,
            "application_count": 3,
            "total_product": 300000,
        },
        {
            "product": "Boro",
            "unit_price": 3.99,
            "quantity_used": 250,
            "application_dose_ml": 500,
            "application_volume_l": 200,
            "application_count": 3,
            "total_product": 300000,
        }

    ]
}