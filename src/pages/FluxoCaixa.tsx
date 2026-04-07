import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FluxoCaixa() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"hoje" | "mes">("hoje");
  const [entradas, setEntradas] = useState(0);
  const [saidas, setSaidas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateCashFlow();
  }, [period]);

  const calculateCashFlow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      let startDate: Date, endDate: Date;

      if (period === "hoje") {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
      } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      const [salesRes, expensesRes] = await Promise.all([
        supabase
          .from("sales")
          .select("total")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("date", startDate.toISOString())
          .lte("date", endDate.toISOString()),
        supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", user.id)
          .eq("status", "paid")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString()),
      ]);

      const totalEntradas = (salesRes.data || []).reduce((sum, s) => sum + Number(s.total), 0);
      const totalSaidas = (expensesRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);

      setEntradas(totalEntradas);
      setSaidas(totalSaidas);
    } catch (err) {
      console.error("Erro ao calcular fluxo de caixa:", err);
    } finally {
      setLoading(false);
    }
  };

  const saldoAtual = entradas - saidas;
  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Wallet className="w-4 h-4" />
            GESTUM
          </div>
          <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
        </div>

        {/* Filtros */}
        <div className="flex justify-center gap-2">
          <Button
            variant={period === "hoje" ? "default" : "outline"}
            onClick={() => setPeriod("hoje")}
            className={`rounded-full px-6 ${period === "hoje" ? "bg-gradient-primary border-0 shadow-[var(--shadow-primary)]" : ""}`}
          >
            Hoje
          </Button>
          <Button
            variant={period === "mes" ? "default" : "outline"}
            onClick={() => setPeriod("mes")}
            className={`rounded-full px-6 ${period === "mes" ? "bg-gradient-primary border-0 shadow-[var(--shadow-primary)]" : ""}`}
          >
            Mês {format(new Date(), "MMM", { locale: ptBR }).toUpperCase()}
          </Button>
        </div>

        {/* Saldo */}
        <Card className="card-elevated text-center">
          <CardContent className="py-8">
            <p className="stat-label mb-2">Saldo Atual</p>
            <p className={`text-5xl font-bold tracking-tight ${saldoAtual >= 0 ? "text-secondary" : "text-destructive"}`}>
              R$ {formatCurrency(saldoAtual)}
            </p>
          </CardContent>
        </Card>

        {/* Entradas e Saídas */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-elevated overflow-hidden border-0">
            <CardContent className="p-0">
              <div className="p-5 flex items-center gap-3">
                <div className="icon-badge-success">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-lg font-semibold text-foreground">Entradas</span>
              </div>
              <div className="bg-gradient-success p-6 text-center">
                <p className="text-3xl font-bold text-white">R$ {formatCurrency(entradas)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated overflow-hidden border-0">
            <CardContent className="p-0">
              <div className="p-5 flex items-center gap-3">
                <div className="icon-badge-danger">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-lg font-semibold text-foreground">Saídas</span>
              </div>
              <div className="bg-gradient-danger p-6 text-center">
                <p className="text-3xl font-bold text-white">R$ {formatCurrency(saidas)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
