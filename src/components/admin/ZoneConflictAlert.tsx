import type { TerritoryConflict } from '@/types/zone';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ZoneConflictAlertProps {
  conflicts: TerritoryConflict[];
}

export const ZoneConflictAlert = ({ conflicts }: ZoneConflictAlertProps) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-sm font-semibold">Superposición Territorial Detectada</AlertTitle>
      <AlertDescription className="text-xs space-y-1 mt-1">
        <p>Los siguientes territorios entran en conflicto con zonas activas creadas previamente:</p>
        <ul className="list-disc pl-4 space-y-0.5">
          {conflicts.map((c, i) => (
            <li key={i}>
              <strong className="font-medium">{c.territory_name}</strong>: {c.message}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
