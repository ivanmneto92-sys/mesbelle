import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalHeader } from "./GlobalHeader";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function AppLayout({ children, fullWidth }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-surface-cream">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <GlobalHeader />
          <main className="flex-1 overflow-auto">
            <div className={cn("mx-auto w-full p-4 sm:p-6 lg:p-8", fullWidth ? "max-w-none" : "max-w-[1480px]")}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
