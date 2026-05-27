import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, QrCode, Share2, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import PageShell from "@/components/PageShell";

interface SaleItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface Sale {
  id: string;
  total: number;
  payment_method: string;
  status: string;
  created_at: string;
  items?: SaleItem[];
}

const Pix = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const { data: salesData, error } = await supabase
      .from("sales")
      .select("*")
      .eq("payment_method", "pix")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar vendas");
      return;
    }

    if (salesData) {
      const salesWithItems = await Promise.all(
        salesData.map(async (sale) => {
          const { data: items } = await supabase
            .from("sale_items")
            .select("product_name, quantity, price")
            .eq("sale_id", sale.id);
          
          return { ...sale, items: items || [] };
        })
      );
      setSales(salesWithItems);
    }
  };

  const handleApproveSale = async (saleId: string) => {
    const { error } = await supabase
      .from("sales")
      .update({ status: "completed" })
      .eq("id", saleId);

    if (error) {
      toast.error("Erro ao aprovar pagamento");
      return;
    }

    toast.success("Pagamento aprovado!");
    loadSales();
    setShowDetails(false);
  };

  const handleCancelSale = async (saleId: string) => {
    const { error } = await supabase
      .from("sales")
      .update({ status: "cancelled" })
      .eq("id", saleId);

    if (error) {
      toast.error("Erro ao cancelar venda");
      return;
    }

    toast.success("Venda cancelada!");
    loadSales();
    setShowDetails(false);
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetails(true);
  };

  return (
    <PageShell
      accent="green"
      eyebrow="Recebimentos"
      title="Cobranças Pix"
      subtitle="Acompanhe pagamentos, aprovações e cancelamentos."
      actions={
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas PIX</CardTitle>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma venda PIX encontrada
              </p>
            ) : (
              <div className="space-y-3">
                {sales.map(sale => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">R$ {Number(sale.total).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString()} às{" "}
                        {new Date(sale.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          sale.status === "completed" 
                            ? "default" 
                            : sale.status === "cancelled"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          sale.status === "completed"
                            ? "bg-secondary text-secondary-foreground"
                            : sale.status === "pending"
                            ? "text-warning border-warning"
                            : ""
                        }
                      >
                        {sale.status === "completed" 
                          ? "Pago" 
                          : sale.status === "cancelled"
                          ? "Cancelada"
                          : "Pendente"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(sale)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Venda</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedSale.status === "completed"
                        ? "default"
                        : selectedSale.status === "cancelled"
                        ? "destructive"
                        : "outline"
                    }
                    className={
                      selectedSale.status === "completed"
                        ? "bg-secondary text-secondary-foreground"
                        : selectedSale.status === "pending"
                        ? "text-warning border-warning"
                        : ""
                    }
                  >
                    {selectedSale.status === "completed"
                      ? "Pago"
                      : selectedSale.status === "cancelled"
                      ? "Cancelada"
                      : "Pendente"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Itens da Venda</p>
                  <div className="space-y-2">
                    {selectedSale.items?.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x R$ {Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          R$ {(item.quantity * Number(item.price)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-lg font-semibold">Total</p>
                    <p className="text-2xl font-bold">
                      R$ {Number(selectedSale.total).toFixed(2)}
                    </p>
                  </div>

                  {selectedSale.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleCancelSale(selectedSale.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar Venda
                      </Button>
                      <Button
                        className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        onClick={() => handleApproveSale(selectedSale.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aprovar Pagamento
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
};

export default Pix;
