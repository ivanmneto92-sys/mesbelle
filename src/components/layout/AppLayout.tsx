import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { GlobalHeader } from "./GlobalHeader";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-surface-cream">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <GlobalHeader />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
