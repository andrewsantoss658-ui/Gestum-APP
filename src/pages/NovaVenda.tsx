import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

const NovaVenda = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"dinheiro" | "pix" | "cartao">("dinheiro");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      toast.error("Erro ao validar sessão");
      return;
    }
    if (!authData.user) {
      toast.error("Sessão expirada. Faça login novamente.");
      navigate("/login", { replace: true });
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("name");

    if (error) {
      toast.error("Erro ao carregar produtos");
      return;
    }

    setProducts(data || []);
  };

  const addToCart = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto");
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existingItem = cart.find(item => item.productId === selectedProductId);

    if (existingItem) {
      if (existingItem.quantity >= product.quantity) {
        toast.error("Quantidade maior que o estoque disponível");
        return;
      }
      setCart(cart.map(item =>
        item.productId === selectedProductId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
      }]);
    }

    setSelectedProductId("");
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    const item = cart.find(i => i.productId === productId);
    
    if (!product || !item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.quantity) {
      toast.error("Quantidade maior que o estoque disponível");
      return;
    }

    setCart(cart.map(i =>
      i.productId === productId ? { ...i, quantity: newQuantity } : i
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos à venda");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/login", { replace: true });
        return;
      }

      // Criar a venda
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          user_id: session.user.id,
          total,
          payment_method: paymentMethod,
          status: paymentMethod === "pix" ? "pending" : "completed",
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar os itens da venda
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Atualizar estoque dos produtos
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ quantity: product.quantity - item.quantity })
            .eq("id", item.productId);

          if (updateError) throw updateError;
        }
      }

      toast.success("Venda registrada com sucesso!");
      
      if (paymentMethod === "pix") {
         navigate("/pix/novo");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error("Erro ao registrar venda: " + error.message);
    }
  };

  return (
    <PageShell
      accent="green"
      eyebrow="Venda"
      title="Nova Venda"
      subtitle="Monte o carrinho, escolha o pagamento e finalize em segundos."
      actions={
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Adicionar produto */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Select value={selectedProductId || undefined} onValueChange={setSelectedProductId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - R$ {product.price.toFixed(2)} (Estoque: {product.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addToCart}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Carrinho */}
        <Card>
          <CardHeader>
            <CardTitle>Itens da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum item adicionado
              </p>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {item.price.toFixed(2)} × {item.quantity} = R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.productId, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total e Pagamento */}
        {cart.length > 0 && (
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total da Venda</span>
                <span className="text-3xl font-bold">R$ {total.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment" className="text-primary-foreground">
                  Forma de Pagamento
                </Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger id="payment" className="bg-primary-foreground text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleFinalizeSale}
              >
                Finalizar Venda
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
};

export default NovaVenda;
