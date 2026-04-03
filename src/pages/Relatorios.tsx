import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, ShoppingBag, DollarSign, Download, FileSpreadsheet } from "lucide-react";
import { exportFinancialReportPDF, exportFinancialReportExcel } from "@/lib/export";
import { toast } from "sonner";

interface SaleRow {
  id: string;
  date: string;
  total: number;
  payment_method: string;
  status: string;
}

interface SaleItemRow {
  product_id: string;
  product_name: string;
  quantity: number;
}

interface ExpenseRow {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  status: string;
  category: string;
}

const Relatorios = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("7");
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItemRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    topProduct: { name: "N/A", sales: 0 },
    recentSales: [] as SaleRow[],
  });

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const days = parseInt(period);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const [salesRes, itemsRes, expensesRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, date, total, payment_method, status")
          .eq("user_id", user.id)
          .gte("date", cutoffDate.toISOString())
          .order("date", { ascending: false }),
        supabase
          .from("sale_items")
          .select("product_id, product_name, quantity, sale:sales!inner(date, user_id)")
          .eq("sale.user_id", user.id)
          .gte("sale.date", cutoffDate.toISOString()),
        supabase
          .from("expenses")
          .select("id, name, amount, due_date, status, category")
          .eq("user_id", user.id),
      ]);

      const salesData = salesRes.data || [];
      const itemsData = (itemsRes.data || []) as SaleItemRow[];
      const expensesData = expensesRes.data || [];

      setSales(salesData);
      setSaleItems(itemsData);
      setExpenses(expensesData);

      // Calculate stats
      const total = salesData.reduce((sum, s) => sum + Number(s.total), 0);
      const average = salesData.length > 0 ? total / days : 0;

      // Top product
      const productSales: Record<string, { name: string; qty: number }> = {};
      itemsData.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: item.product_name, qty: 0 };
        }
        productSales[item.product_id].qty += item.quantity;
      });

      let topProduct = { name: "N/A", sales: 0 };
      Object.values(productSales).forEach(p => {
        if (p.qty > topProduct.sales) topProduct = { name: p.name, sales: p.qty };
      });

      setStats({
        total,
        average,
        topProduct,
        recentSales: salesData.slice(0, 10),
      });
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const periodText = period === "7" ? "Últimos 7 dias" : period === "15" ? "Últimos 15 dias" : "Últimos 30 dias";
    const mappedSales = sales.map(s => ({
      id: s.id,
      date: s.date,
      total: s.total,
      paymentMethod: s.payment_method as any,
      status: s.status as any,
      items: [],
    }));
    const mappedExpenses = expenses.map(e => ({
      id: e.id,
      name: e.name,
      amount: e.amount,
      dueDate: e.due_date,
      status: e.status as any,
      category: e.category,
      createdAt: "",
    }));
    exportFinancialReportPDF(mappedSales, mappedExpenses, periodText);
    toast.success("Relatório em PDF exportado com sucesso!");
  };

  const handleExportExcel = () => {
    const periodText = period === "7" ? "Últimos 7 dias" : period === "15" ? "Últimos 15 dias" : "Últimos 30 dias";
    const mappedSales = sales.map(s => ({
      id: s.id,
      date: s.date,
      total: s.total,
      paymentMethod: s.payment_method as any,
      status: s.status as any,
      items: [],
    }));
    const mappedExpenses = expenses.map(e => ({
      id: e.id,
      name: e.name,
      amount: e.amount,
      dueDate: e.due_date,
      status: e.status as any,
      category: e.category,
      createdAt: "",
    }));
    exportFinancialReportExcel(mappedSales, mappedExpenses, periodText);
    toast.success("Relatório em CSV exportado com sucesso!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Relatórios</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Período</span>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.total.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Últimos {period} dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Diária</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.average.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Por dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mais Vendido</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{stats.topProduct.name}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.topProduct.sales} unidades</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma venda no período</p>
            ) : (
              <div className="space-y-3">
                {stats.recentSales.map(sale => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">R$ {Number(sale.total).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString("pt-BR")} - {sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Relatorios;
