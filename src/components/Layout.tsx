import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import type { ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { campaigns, currentCampaign, setCurrentCampaign, montes } = useApp();
  
  const totalArea = montes.reduce((acc, m) => acc + m.hectareas, 0);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Campaña Actual:</span>
                <Select 
                  value={currentCampaign.toString()} 
                  onValueChange={(value) => setCurrentCampaign(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.filter(campaign => campaign && campaign.year).map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.year.toString()}>
                        Campaña {campaign.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <p className="text-muted-foreground">Área Total</p>
                <p className="font-semibold text-foreground">{totalArea.toFixed(1)} ha</p>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
