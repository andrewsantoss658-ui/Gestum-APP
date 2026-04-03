import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Bell, DollarSign, Users, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: "pix" | "debt" | "expense";
  title: string;
  description: string;
  amount?: number;
  date: string;
  priority: "high" | "medium" | "low";
}

export default function Notificacoes() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [pixRes, clientsRes, expensesRes] = await Promise.all([
        supabase.from("pix_charges").select("id, amount, description, status, created_at").eq("user_id", user.id).eq("status", "pending"),
        supabase.from("clients").select("id, name, balance").eq("user_id", user.id).gt("balance", 0),
        supabase.from("expenses").select("id, name, amount, due_date, status").eq("user_id", user.id).eq("status", "pending"),
      ]);

      const allNotifications: Notification[] = [];

      (pixRes.data || []).forEach(pix => {
        allNotifications.push({
          id: `pix-${pix.id}`,
          type: "pix",
          title: "Cobrança Pix Pendente",
          description: pix.description,
          amount: Number(pix.amount),
          date: pix.created_at,
          priority: "high",
        });
      });

      (clientsRes.data || []).forEach(client => {
        allNotifications.push({
          id: `debt-${client.id}`,
          type: "debt",
          title: "Dívida Pendente",
          description: `${client.name} possui saldo devedor`,
          amount: Number(client.balance),
          date: new Date().toISOString(),
          priority: Number(client.balance) > 500 ? "high" : "medium",
        });
      });

      const today = new Date();
      (expensesRes.data || []).forEach(expense => {
        const dueDate = new Date(expense.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 7) {
          allNotifications.push({
            id: `expense-${expense.id}`,
            type: "expense",
            title: daysUntilDue < 0 ? "Conta Vencida" : "Conta a Vencer",
            description: `${expense.name} - Vencimento: ${new Date(expense.due_date).toLocaleDateString("pt-BR")}`,
            amount: Number(expense.amount),
            date: expense.due_date,
            priority: daysUntilDue < 0 ? "high" : daysUntilDue <= 3 ? "medium" : "low",
          });
        }
      });

      allNotifications.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setNotifications(allNotifications);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pix": return <DollarSign className="h-5 w-5" />;
      case "debt": return <Users className="h-5 w-5" />;
      case "expense": return <AlertCircle className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case "pix": navigate("/pix/novo"); break;
      case "debt": navigate("/caderneta"); break;
      case "expense": navigate("/contas-pagar"); break;
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
        <Button variant="ghost" onClick={() => navigate("/configuracoes")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Configurações
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Notificações</h1>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Nenhuma notificação pendente</p>
              <p className="text-sm text-muted-foreground mt-2">Você está em dia com todos os compromissos!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {notifications.length} {notifications.length === 1 ? "Notificação" : "Notificações"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className="flex items-start gap-4 p-4 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          <Badge variant={getPriorityColor(notification.priority)}>
                            {notification.priority === "high" ? "Urgente" : notification.priority === "medium" ? "Média" : "Baixa"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.description}</p>
                        {notification.amount !== undefined && (
                          <p className="text-lg font-bold text-primary">R$ {notification.amount.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
