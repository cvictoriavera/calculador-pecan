import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";

export function CampaignTimeline() {
  const { campaigns, currentCampaign, setCurrentCampaign } = useApp();
  
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ordenar campañas
  const sortedCampaigns = [...campaigns].sort((a, b) => a.year - b.year);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    // Tolerancia de 5px
    setIsAtTop(scrollTop <= 5);
    setIsAtBottom(Math.abs(scrollHeight - clientHeight - scrollTop) <= 5);
  };

  const handleScroll = () => checkScroll();

  const scrollUp = () => {
    scrollContainerRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
  };

  const scrollDown = () => {
    scrollContainerRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
  };

  // Verificar scroll al cargar o cambiar campañas
  useEffect(() => {
    checkScroll();
    // Agregamos un listener de resize por si la ventana cambia de tamaño
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [campaigns]);

  return (
    <div className="flex flex-col items-center h-full w-full bg-transparent">
      {/* Botón Subir */}
      <Button
        variant="ghost"
        size="icon"
        onClick={scrollUp}
        disabled={isAtTop}
        className={cn(
          "h-8 w-8 rounded-full mb-2 transition-opacity", 
          isAtTop ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-muted/50"
        )}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      
      {/* Contenedor con Scroll - Flex-1 para ocupar espacio restante */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col items-center gap-1 py-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Ocultar scrollbar nativo
      >
        {sortedCampaigns.map((campaign, index) => (
          <div key={campaign.id} className="flex flex-col items-center shrink-0">
            {/* Línea de conexión */}
            {index > 0 && (
              <div className="w-0.5 h-4 bg-border/50 -mt-2 mb-2" />
            )}

            {/* Botón de Año */}
            <button
              onClick={() => setCurrentCampaign(campaign.year)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                "border-2",
                currentCampaign === campaign.year
                  ? "bg-primary border-primary text-primary-foreground shadow-md scale-110"
                  : "bg-transparent border-muted-foreground/20 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-background/50"
              )}
            >
              {campaign.year}
            </button>
          </div>
        ))}
      </div>
      
      {/* Botón Bajar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={scrollDown}
        disabled={isAtBottom}
        className={cn(
          "h-8 w-8 rounded-full mt-2 transition-opacity",
          isAtBottom ? "opacity-0 pointer-events-none" : "opacity-100 hover:bg-muted/50"
        )}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}