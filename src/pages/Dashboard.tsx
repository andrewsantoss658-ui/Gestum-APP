import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import {
  ShoppingCart,
  Package,
  FileText,
  Plus,
  Users,
  Receipt,
  Wallet,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [todaySales, setTodaySales] = useState(0);
  const [last7DaysSales, setLast7DaysSales] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      navigate("/onboarding", { replace: true });
      return;
    }
    loadSalesData();
  }, [navigate]);

  const loadSalesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: sales, error } = await supabase
        .from("sales")
        .select("total, date, status")
        .eq("user_id", user.id)
        .gte("date", sevenDaysAgo.toISOString())
        .eq("status", "completed");

      if (error) throw error;

      const today = new Date().toDateString();
      const todayTotal = (sales || [])
        .filter(s => new Date(s.date).toDateString() === today)
        .reduce((sum, s) => sum + Number(s.total), 0);
      setTodaySales(todayTotal);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toDateString();
      });

      const salesByDay = last7Days.map(day =>
        (sales || [])
          .filter(s => new Date(s.date).toDateString() === day)
          .reduce((sum, s) => sum + Number(s.total), 0)
      );
      setLast7DaysSales(salesByDay);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const weekTotal = last7DaysSales.reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero card - Vendas de Hoje */}
        <Card className="bg-gradient-primary text-primary-foreground border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(211_100%_70%_/_0.3),_transparent_60%)]" />
          <CardHeader className="relative z-10 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium opacity-90">Vendas de Hoje</CardTitle>
              <div className="icon-badge bg-white/15 text-white backdrop-blur-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <p className="stat-value text-4xl text-white">
              R$ {todaySales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm opacity-75 mt-1">
              Semana: R$ {weekTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Gráfico de barras - Últimos 7 dias */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-2">
              {last7DaysSales.map((value, index) => {
                const maxValue = Math.max(...last7DaysSales, 1);
                const height = (value / maxValue) * 100;
                const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
                const isToday = index === 6;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {value > 0 ? `R$${value.toFixed(0)}` : ""}
                    </span>
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${
                        isToday ? "bg-gradient-primary" : "bg-primary/20"
                      }`}
                      style={{ height: `${Math.max(height, 6)}%` }}
                    />
                    <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {dayLabels[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ações rápidas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Ações Rápidas</h2>

          <Button
            className="w-full justify-start text-left h-auto py-5 bg-gradient-primary border-0 shadow-[var(--shadow-primary)] hover:shadow-lg transition-all"
            onClick={() => navigate("/vendas/nova")}
          >
            <div className="bg-white/20 rounded-xl p-2.5 mr-4">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-base">Registrar Nova Venda</p>
              <p className="text-sm opacity-80 font-normal">Adicione uma venda ao sistema</p>
            </div>
            <ArrowUpRight className="w-5 h-5 ml-auto opacity-60" />
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="card-elevated cursor-pointer group" onClick={() => navigate("/estoque")}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="icon-badge-primary group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Ver Estoque</p>
                  <p className="text-xs text-muted-foreground">Controle de produtos</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
            <Card className="card-elevated cursor-pointer group" onClick={() => navigate("/relatorios")}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="icon-badge-primary group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Ver Relatórios</p>
                  <p className="text-xs text-muted-foreground">Análise detalhada</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="card-elevated cursor-pointer group" onClick={() => navigate("/caderneta")}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="icon-badge-success group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-medium text-foreground text-sm">Caderneta Digital</span>
              </CardContent>
            </Card>
            <Card className="card-elevated cursor-pointer group" onClick={() => navigate("/contas-pagar")}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="icon-badge-warning group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="font-medium text-foreground text-sm">Contas a Pagar</span>
              </CardContent>
            </Card>
            <Card className="card-elevated cursor-pointer group" onClick={() => navigate("/fluxo-caixa")}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="icon-badge-primary group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="font-medium text-foreground text-sm">Fluxo de Caixa</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
