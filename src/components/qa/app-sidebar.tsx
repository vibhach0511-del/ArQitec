import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Atom,
  Network,
  Gauge,
  ShieldCheck,
  SplitSquareHorizontal,
  Sparkles,
  CircuitBoard,
  SlidersHorizontal,
  Zap,
  Grid2x2,
  Wand2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const nav = [
  { title: "Workspace", url: "/workspace", icon: LayoutDashboard },
  { title: "Materials", url: "/materials", icon: Atom },
  { title: "Topology", url: "/topology", icon: Network },
  { title: "Benchmarks", url: "/benchmarks", icon: Gauge },
  { title: "QEC Advisor", url: "/qec", icon: ShieldCheck },
  { title: "Co-Design Selector", url: "/codesign", icon: Wand2 },
  { title: "Surface Code", url: "/surface-code", icon: Grid2x2 },
  { title: "Code Designer", url: "/code-designer", icon: SlidersHorizontal },
  { title: "Quantum vs Classical", url: "/advantage", icon: Zap },
  { title: "Results", url: "/results", icon: SplitSquareHorizontal },
  { title: "AI Agent", url: "/agent", icon: Sparkles },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="border-b border-border/60">
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan/30 to-violet/30 border border-cyan/40">
            <CircuitBoard className="h-4 w-4 text-cyan" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold tracking-tight text-foreground">ArQiteQ</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mono">qa · v0.9.4</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Co-Design
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link
                        to={item.url}
                        className="flex items-center gap-2 data-[active=true]:text-cyan"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/60">
        {!collapsed && (
          <div className="px-2 py-2 text-[10px] mono text-muted-foreground leading-relaxed">
            <div className="flex items-center justify-between">
              <span>RUN</span>
              <span className="text-cyan">qa-run-0427</span>
            </div>
            <div className="flex items-center justify-between">
              <span>SEED</span>
              <span>0x9F2C1A</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}