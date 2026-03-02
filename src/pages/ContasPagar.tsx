import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, ShoppingCart, Droplet, FileText, DollarSign, Check, Pencil, Trash2 } from "lucide-react";
import { getExpenses, saveExpense, updateExpenseStatus, type Expense } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { differenceInDays, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContasPagar() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({ name: "", amount: "", dueDate: "", category: "" });

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = () => {
    const all = getExpenses().map(e => {
      if (e.status === "pending" && new Date(e.dueDate) < new Date()) {
        return { ...e, status: "overdue" as const };
      }
      return e;
    });
    setExpenses(all);
  };

  const pendingExpenses = expenses.filter(e => e.status !== "paid");
  const paidExpenses = expenses.filter(e => e.status === "paid");

  const openNew = () => {
    setEditingExpense(null);
    setFormData({ name: "", amount: "", dueDate: "", category: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      dueDate: expense.dueDate,
      category: expense.category,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.amount || !formData.dueDate) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (editingExpense) {
      // Update existing
      const all = getExpenses().map(e =>
        e.id === editingExpense.id
          ? { ...e, name: formData.name, amount: parseFloat(formData.amount), dueDate: formData.dueDate, category: formData.category }
          : e
      );
      localStorage.setItem("gestum_expenses", JSON.stringify(all));
      toast({ title: "Despesa atualizada", description: "Alterações salvas com sucesso" });
    } else {
      const expense: Expense = {
        id: Date.now().toString(),
        name: formData.name,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        status: "pending",
        category: formData.category,
        createdAt: new Date().toISOString(),
      };
      saveExpense(expense);
      toast({ title: "Despesa registrada", description: "Despesa adicionada com sucesso" });
    }

    setIsDialogOpen(false);
    setEditingExpense(null);
    loadExpenses();
  };

  const handleMarkPaid = (id: string) => {
    updateExpenseStatus(id, "paid");
    loadExpenses();
    toast({ title: "Conta paga!", description: "Despesa marcada como paga" });
  };

  const handleDelete = (id: string) => {
    const all = getExpenses().filter(e => e.id !== id);
    localStorage.setItem("gestum_expenses", JSON.stringify(all));
    loadExpenses();
    toast({ title: "Despesa removida" });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "aluguel": return <Calendar className="h-5 w-5" />;
      case "mercadoria": return <ShoppingCart className="h-5 w-5" />;
      case "água": case "agua": return <Droplet className="h-5 w-5" />;
      case "das": return <FileText className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const getExpenseStatusBadge = (expense: Expense) => {
    if (expense.status === "paid") return { label: "Paga", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    if (expense.status === "overdue") return { label: "Vencida", className: "bg-destructive text-destructive-foreground" };
    const days = differenceInDays(parseISO(expense.dueDate), new Date());
    if (days <= 5 && days >= 0) return { label: `Vence em ${days}d`, className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
    return null;
  };

  const renderExpenseItem = (expense: Expense, showActions: boolean) => {
    const badge = getExpenseStatusBadge(expense);
    return (
      <div key={expense.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-muted-foreground">{getCategoryIcon(expense.category || expense.name)}</div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{expense.name}</p>
            <p className="text-sm text-muted-foreground">
              R$ {expense.amount.toFixed(2)} · Venc: {expense.dueDate}
            </p>
            {badge && (
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>
        </div>
        {showActions && (
          <div className="flex items-center gap-1 ml-2">
            {expense.status !== "paid" && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleMarkPaid(expense.id)} title="Marcar como paga">
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(expense)} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(expense.id)} title="Excluir">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-primary font-bold text-xl">GE</span>
            <span className="text-muted-foreground font-bold text-xl">STUM</span>
          </div>
          <h1 className="text-4xl font-bold">Contas a Pagar</h1>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending">Pendentes ({pendingExpenses.length})</TabsTrigger>
            <TabsTrigger value="paid">Pagas ({paidExpenses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardContent className="p-4">
                {pendingExpenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma conta pendente</p>
                ) : (
                  pendingExpenses.map(e => renderExpenseItem(e, true))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid">
            <Card>
              <CardContent className="p-4">
                {paidExpenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma conta paga ainda</p>
                ) : (
                  paidExpenses.map(e => renderExpenseItem(e, true))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Nome da Despesa *</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Aluguel, Água, DAS" />
              </div>
              <div>
                <Label htmlFor="amount">Valor *</Label>
                <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input id="dueDate" type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Ex: Aluguel, Mercadoria" />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingExpense ? "Salvar Alterações" : "Registrar Despesa"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button size="lg" className="fixed bottom-6 right-6 h-16 w-auto px-8 rounded-full shadow-lg" onClick={openNew}>
          <Plus className="mr-2 h-6 w-6" />
          <span className="text-lg">Registrar Despesa</span>
        </Button>
      </div>
    </div>
  );
}
