import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { HelpButton } from "@/components/HelpButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Bell, ChevronRight } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  produtos: "Produtos",
  estoque: "Estoque",
  vendas: "Vendas",
  nova: "Nova",
  pix: "Pix",
  novo: "Novo",
  relatorios: "Relatórios",
  configuracoes: "Configurações",
  "minha-conta": "Minha Conta",
  notificacoes: "Notificações",
  suporte: "Suporte",
  caderneta: "Caderneta",
  "contas-pagar": "Contas a Pagar",
  "fluxo-caixa": "Fluxo de Caixa",
  "nota-fiscal": "Nota Fiscal",
  admin: "Admin",
  equipes: "Equipes",
  "gestao-suporte": "Gestão",
  "relatorios-suporte": "Relatórios",
  "config-chat": "Config. Chat",
};

function getRouteAccent(pathname: string): "blue" | "green" | "amber" | "violet" | "rose" {
  if (pathname.startsWith("/fluxo-caixa") || pathname.startsWith("/pix")) return "green";
  if (pathname.startsWith("/contas-pagar") || pathname.startsWith("/notificacoes")) return "amber";
  if (pathname.startsWith("/caderneta") || pathname.startsWith("/suporte")) return "violet";
  if (pathname.startsWith("/relatorios") || pathname.startsWith("/nota-fiscal")) return "rose";
  return "blue";
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="font-medium text-foreground/70">GESTUM</span>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className={i === parts.length - 1 ? "text-foreground font-medium" : ""}>
            {ROUTE_LABELS[p] || p}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/70 backdrop-blur-md px-3 md:px-5 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="shrink-0" />
              <div className="h-5 w-px bg-border hidden md:block" />
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                onClick={() => navigate("/notificacoes")}
                aria-label="Notificações"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main
            key={pathname}
            data-accent={getRouteAccent(pathname)}
            className="flex-1 animate-fade-in page-bg-aurora route-accent"
          >
            {children}
          </main>
        </div>
      </div>
      <HelpButton />
    </SidebarProvider>
  );
}
