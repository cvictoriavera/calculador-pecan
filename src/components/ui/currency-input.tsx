import * as React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: number) => void;
  value?: number | string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, onChange, value, ...props }, ref) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // 1. Regex de validación:
      // ^\d* -> Empieza con dígitos (o vacío)
      // \.?       -> Puede tener un punto opcional
      // \d{0,2}$  -> Termina con 0 a 2 dígitos decimales
      const regex = /^\d*\.?\d{0,2}$/;

      // 2. Si el texto no cumple el formato (ej: tiene 3 decimales), 
      // interrumpimos la función. Al ser un input controlado, el valor
      // visual no cambiará, dando el efecto de que "no escribe".
      if (inputValue && !regex.test(inputValue)) {
        return;
      }

      // 3. Procesamos el valor para el onChange
      // Mantenemos tu lógica de evitar negativos
      const numValue = Math.max(0, parseFloat(inputValue) || 0);

      onChange?.(numValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevenir la tecla menos (-) y exponentes (e)
      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          $
        </span>
        <input
          type="number"
          min="0"
          step="0.01" // Ayuda visualmente a los navegadores
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent pl-7 pr-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          value={value || ""}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };