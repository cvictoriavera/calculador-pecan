import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfoCardProps {
  storageKey?: string;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  storageKey,
  title,
  children,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(() => {
    if (!storageKey) return true;
    try {
      return localStorage.getItem(storageKey) !== 'true';
    } catch {
      return true;
    }
  });

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch (e) {
        console.error('Error saving banner state to localStorage', e);
      }
    }
  };

  return (
    <Card className={`bg-amber-50 border-amber-200 mb-6 relative ${className}`}>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-4">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            {title && (
              <p className="font-semibold text-amber-900">
                {title}
              </p>
            )}
            <div className="text-sm text-amber-800/90 leading-relaxed">
              {children}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-amber-700 hover:text-amber-900 hover:bg-amber-200/60 shrink-0 rounded-full -mr-1 -mt-1"
          onClick={handleDismiss}
          title="Cerrar mensaje"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      </CardContent>
    </Card>
  );
};
