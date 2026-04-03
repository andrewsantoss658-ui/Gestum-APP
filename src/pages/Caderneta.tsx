import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Search, Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
  created_at: string;
}

export default function Caderneta() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "", email: "" });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = async () => {
    if (!newClient.name) {
      toast({ title: "Erro", description: "Nome do cliente é obrigatório", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("clients").insert({
        user_id: user.id,
        name: newClient.name,
        phone: newClient.phone || null,
        email: newClient.email || null,
        balance: 0,
      });

      if (error) throw error;

      toast({ title: "Cliente adicionado", description: "Cliente cadastrado com sucesso" });
      setIsDialogOpen(false);
      setNewClient({ name: "", phone: "", email: "" });
      loadClients();
    } catch (err) {
      console.error("Erro ao adicionar cliente:", err);
      toast({ title: "Erro", description: "Erro ao cadastrar cliente", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2">GESTUM</p>
          <h1 className="text-4xl font-bold mb-8">Caderneta Digital</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar Cliente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 text-lg"
          />
        </div>

        <div className="space-y-3 mb-20">
          {filteredClients.map((client) => (
            <Card key={client.id} className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${client.balance > 0 ? 'bg-warning/20' : 'bg-muted'}`}>
                    <User className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{client.name}</p>
                    {client.balance > 0 && (
                      <span className="bg-warning text-warning-foreground px-3 py-1 rounded text-sm font-medium">
                        Devendo: R$ {client.balance.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-lg font-mono text-muted-foreground">
                  #{client.id.slice(-6).toUpperCase()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="fixed bottom-6 right-6 h-16 w-auto px-8 rounded-full shadow-lg">
              <Plus className="mr-2 h-6 w-6" />
              <span className="text-lg">Adicionar Cliente</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Nome do cliente" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <Button onClick={handleAddClient} className="w-full">Adicionar Cliente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
