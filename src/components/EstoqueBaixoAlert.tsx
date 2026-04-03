import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function EstoqueBaixoAlert() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Array<{ name: string; quantity: number }>>([]);

  useEffect(() => {
    checkLowStock();
  }, []);

  const checkLowStock = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("products")
        .select("name, quantity")
        .eq("user_id", user.id)
        .lte("quantity", 10)
        .order("quantity", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setLowStockProducts(data);
        setVisible(true);
      }
    } catch (err) {
      console.error("Erro ao verificar estoque:", err);
    }
  };

  if (!visible || lowStockProducts.length === 0) return null;

  return (
    <div className="p-6">
      <Card className="border-warning bg-warning/5">
        <CardHeader className="relative pb-3">
          <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-8 w-8" onClick={() => setVisible(false)}>
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <CardTitle className="text-xl font-bold">Estoque Baixo, é Necessário abastecer!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">Clique em um produto para gerenciar o estoque:</p>
          <div className="space-y-2">
            {lowStockProducts.map((product, index) => (
              <Card key={index} className="cursor-pointer hover:bg-accent transition-colors border-warning/30" onClick={() => navigate("/estoque")}>
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-warning font-semibold">{product.quantity} unid.</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
