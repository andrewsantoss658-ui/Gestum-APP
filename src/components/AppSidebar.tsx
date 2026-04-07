import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import logoGestum from "@/assets/logo_gestum_new.png";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  DollarSign,
  Boxes,
  Users,
  Receipt,
  Wallet,
  FileCheck,
  Settings,
  LogOut,
  ShieldCheck,
  MessageSquare,
  UsersRound,
  BarChart3,
  MessageSquareText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Estoque", url: "/estoque", icon: Boxes },
  { title: "Nova Venda", url: "/vendas/nova", icon: ShoppingCart },
  { title: "Cobrança Pix", url: "/pix/novo", icon: DollarSign },
  { title: "Nota Fiscal", url: "/nota-fiscal", icon: FileCheck },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
];

const financeItems = [
  { title: "Caderneta Digital", url: "/caderneta", icon: Users },
  { title: "Contas a Pagar", url: "/contas-pagar", icon: Receipt },
  { title: "Fluxo de Caixa", url: "/fluxo-caixa", icon: Wallet },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setUserRole(data?.role || null);
    };
    fetchRole();
  }, []);

  const isActive = (path: string) => currentPath === path;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sessão encerrada com sucesso");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <img src={logoGestum} alt="GESTUM" className="w-10 h-10 rounded-xl shrink-0 object-contain shadow-sm" />
          {open && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">GESTUM</h1>
              <p className="text-[11px] text-muted-foreground font-medium">Sistema de Gestão</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(userRole === "master" || userRole === "support" || userRole === "admin") && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/suporte")}>
                    <NavLink to="/admin/suporte" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <MessageSquare className="h-4 w-4" />
                      <span>Painel de Suporte</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {userRole === "master" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/admin/gestao-suporte")}>
                        <NavLink to="/admin/gestao-suporte" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Gestão de Suporte</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/admin/equipes")}>
                        <NavLink to="/admin/equipes" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                          <UsersRound className="h-4 w-4" />
                          <span>Equipes</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/admin/relatorios-suporte")}>
                        <NavLink to="/admin/relatorios-suporte" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                          <BarChart3 className="h-4 w-4" />
                          <span>Relatórios Suporte</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/admin/config-chat")}>
                        <NavLink to="/admin/config-chat" className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                          <MessageSquareText className="h-4 w-4" />
                          <span>Config. Chat</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/configuracoes")}>
                  <NavLink
                    to="/configuracoes"
                    className="hover:bg-muted/50"
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
