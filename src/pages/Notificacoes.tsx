import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, DollarSign, Users, AlertCircle } from "lucide-react";
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
      case "pix": return <div className="icon-badge-primary"><DollarSign className="h-5 w-5" /></div>;
      case "debt": return <div className="icon-badge-warning"><Users className="h-5 w-5" /></div>;
      case "expense": return <div className="icon-badge-danger"><AlertCircle className="h-5 w-5" /></div>;
      default: return <div className="icon-badge-primary"><Bell className="h-5 w-5" /></div>;
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
        <p className="text-muted-foreground animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="icon-badge-primary">
            <Bell className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
        </div>

        {notifications.length === 0 ? (
          <Card className="card-elevated">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold text-foreground">Nenhuma notificação</p>
              <p className="text-sm text-muted-foreground mt-2">Você está em dia com todos os compromissos!</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {notifications.length}
                </span>
                {notifications.length === 1 ? "Notificação" : "Notificações"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
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
                  {index < notifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
