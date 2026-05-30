import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/qa/app-sidebar";
import { StatusBar } from "@/components/qa/status-bar";
import { Toaster } from "@/components/ui/sonner";
import { QAProvider } from "@/lib/qa/store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <QAProvider>
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full bg-background text-foreground">
          <AppSidebar />
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex items-center gap-2 border-b border-border/60 bg-surface-1/60 backdrop-blur px-3 py-1.5">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                q-architect / co-design
              </div>
              <div className="ml-auto flex items-center gap-3 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>region us-west-2</span>
                <span className="inline-flex items-center gap-1.5 text-neon-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
                  cluster healthy
                </span>
              </div>
            </div>
            <StatusBar />
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
        <Toaster richColors theme="dark" position="bottom-right" />
      </SidebarProvider>
    </QAProvider>
  );
}
