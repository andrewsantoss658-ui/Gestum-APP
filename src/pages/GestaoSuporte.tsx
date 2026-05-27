/**
 * ============================================================
 * GESTÃO DE SUPORTE — GestaoSuporte.tsx
 * ============================================================
 *
 * Propósito:
 *   Página exclusiva para o Administrador Geral (role: master) gerenciar
 *   as contas de atendentes do suporte. Permite criar, editar, ativar/
 *   desativar, vincular ao chat e remover contas de suporte, além de
 *   consultar o histórico de auditoria (audit log) de cada conta.
 *
 * Fluxo geral:
 *   1. Verifica se o usuário autenticado possui papel "master"
 *   2. Exibe KPIs: total de contas, contas ativas e vinculadas ao chat
 *   3. Lista todas as contas em tabela com ações inline
 *   4. Permite criar nova conta (restrito a @gestum.com)
 *   5. Permite editar nível de acesso, toggle ativo/inativo e chat
 *   6. Permite visualizar histórico de auditoria de cada conta
 *   7. Permite exclusão permanente com confirmação
 *
 * ============================================================
 */

// ============================
// SEÇÃO 1 — IMPORTAÇÕES
// ============================

/** Hooks do React para estado local e efeitos colaterais */
import { useState, useEffect } from "react";

/** Cliente do backend para verificação de papel do usuário */
import { supabase } from "@/integrations/supabase/client";

/** Componentes de UI do design system */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

/** Ícones utilizados na interface */
import { ShieldCheck, UserPlus, Pencil, Trash2, MessageSquare, History } from "lucide-react";

/** Notificações toast */
import { toast } from "sonner";

/** Hook personalizado — CRUD de contas de suporte e auditoria */
import { useSupportAccounts, useSupportAuditLog, type SupportAccount } from "@/hooks/useSupportAccounts";

/** Utilitário para datas relativas em português */
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import PageShell from "@/components/PageShell";


// ============================
// SEÇÃO 2 — CONSTANTES
// ============================

/**
 * ACCESS_LEVELS
 * Níveis de acesso disponíveis para contas de suporte.
 * Cada nível determina quais funcionalidades o atendente pode usar.
 */
const ACCESS_LEVELS = [
  { value: "support", label: "Suporte" },       // Atendente básico
  { value: "supervisor", label: "Supervisor" },  // Pode supervisionar outros atendentes
  { value: "admin", label: "Administrador" },    // Acesso administrativo total
];


// ============================
// SEÇÃO 3 — COMPONENTE PRINCIPAL
// ============================

/**
 * GestaoSuporte
 *
 * Componente da página de gestão de contas de suporte.
 * Acessível apenas pelo Administrador Geral (master).
 *
 * @returns JSX.Element — Interface de gestão de contas de suporte
 */
export default function GestaoSuporte() {

  // ── 3.1 — Estado de verificação de papel ──────────────────

  /** Papel do usuário autenticado (apenas "master" tem acesso) */
  const [userRole, setUserRole] = useState<string | null>(null);

  /** Indica se a verificação de papel está em andamento */
  const [roleLoading, setRoleLoading] = useState(true);

  /** Hook com CRUD completo de contas de suporte */
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useSupportAccounts();


  // ── 3.2 — Estado do diálogo de criação ────────────────────

  /** Controla visibilidade do diálogo de criação */
  const [createOpen, setCreateOpen] = useState(false);

  /** E-mail da nova conta (deve ser @gestum.com) */
  const [newEmail, setNewEmail] = useState("");

  /** Nível de acesso da nova conta */
  const [newAccessLevel, setNewAccessLevel] = useState("support");

  /** Flag de carregamento durante criação */
  const [creating, setCreating] = useState(false);


  // ── 3.3 — Estado do diálogo de edição ─────────────────────

  /** Conta sendo editada (null = diálogo fechado) */
  const [editAccount, setEditAccount] = useState<SupportAccount | null>(null);

  /** Nível de acesso temporário durante edição */
  const [editAccessLevel, setEditAccessLevel] = useState("");


  // ── 3.4 — Estado do diálogo de auditoria ──────────────────

  /** ID da conta cujo histórico está sendo visualizado */
  const [auditAccountId, setAuditAccountId] = useState<string | undefined>();


  // ── 3.5 — Verificação de papel do usuário ─────────────────

  /** Ao montar, verifica se o usuário tem papel "master" */
  useEffect(() => {
    checkUserRole();
  }, []);

  /**
   * checkUserRole
   * Consulta o papel do usuário autenticado na tabela user_roles.
   * Apenas usuários "master" podem acessar esta página.
   */
  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setUserRole(data?.role || null);
    } catch {
      console.error("Erro ao verificar role");
    } finally {
      setRoleLoading(false);
    }
  };


  // ============================
  // SEÇÃO 4 — CONTROLE DE ACESSO
  // ============================

  /** Enquanto verifica o papel, exibe indicador de carregamento */
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  /** Se não for "master", bloqueia o acesso */
  if (userRole !== "master") {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle className="text-center">Acesso Negado</CardTitle></CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Apenas o Administrador Geral pode acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  // ============================
  // SEÇÃO 5 — FUNÇÕES AUXILIARES (HANDLERS)
  // ============================

  /**
   * handleCreate
   * Cria uma nova conta de suporte.
   * Valida que o e-mail termina com @gestum.com antes de prosseguir.
   */
  const handleCreate = async () => {
    if (!newEmail.endsWith("@gestum.com")) {
      toast.error("Apenas e-mails @gestum.com podem ser contas de suporte");
      return;
    }
    if (!newEmail.trim()) return;

    setCreating(true);
    try {
      await createAccount(newEmail.trim(), newAccessLevel);
      toast.success("Conta de suporte criada com sucesso");
      setCreateOpen(false);
      setNewEmail("");
      setNewAccessLevel("support");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta de suporte");
    } finally {
      setCreating(false);
    }
  };

  /**
   * handleToggleActive
   * Alterna o estado ativo/inativo de uma conta de suporte.
   *
   * @param account - Conta a ser ativada/desativada
   */
  const handleToggleActive = async (account: SupportAccount) => {
    try {
      await updateAccount(account.id, { is_active: !account.is_active });
      toast.success(account.is_active ? "Conta desativada" : "Conta ativada");
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  /**
   * handleToggleChat
   * Alterna a vinculação da conta ao chat ao vivo.
   * Contas vinculadas aparecem como opção de atendente no painel.
   *
   * @param account - Conta a ser vinculada/desvinculada do chat
   */
  const handleToggleChat = async (account: SupportAccount) => {
    try {
      await updateAccount(account.id, { is_linked_to_chat: !account.is_linked_to_chat });
      toast.success(account.is_linked_to_chat ? "Desvinculado do chat" : "Vinculado ao chat");
    } catch {
      toast.error("Erro ao atualizar vinculação");
    }
  };

  /**
   * handleEditSave
   * Salva a edição do nível de acesso de uma conta.
   */
  const handleEditSave = async () => {
    if (!editAccount) return;
    try {
      await updateAccount(editAccount.id, { access_level: editAccessLevel });
      toast.success("Nível de acesso atualizado");
      setEditAccount(null);
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  /**
   * handleDelete
   * Remove permanentemente uma conta de suporte.
   *
   * @param accountId - ID da conta a ser removida
   */
  const handleDelete = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      toast.success("Conta de suporte removida");
    } catch {
      toast.error("Erro ao remover conta");
    }
  };

  /**
   * getAccessBadge
   * Retorna um Badge estilizado conforme o nível de acesso.
   *
   * @param level - Nível de acesso: "support" | "supervisor" | "admin"
   * @returns JSX.Element — Badge colorido com label traduzido
   */
  const getAccessBadge = (level: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      support: { variant: "secondary", label: "Suporte" },
      supervisor: { variant: "default", label: "Supervisor" },
      admin: { variant: "destructive", label: "Administrador" },
    };
    const c = config[level] || config.support;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };


  // ============================
  // SEÇÃO 6 — RENDERIZAÇÃO (JSX)
  // ============================

  return (
    <PageShell
      accent="violet"
      eyebrow="Administração"
      title="Gestão de Suporte"
      subtitle="Gerencie contas e permissões do suporte ao vivo."
      actions={
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Nova Conta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Conta de Suporte</DialogTitle>
              <DialogDescription>Apenas e-mails @gestum.com podem ser vinculados como suporte.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Campo de e-mail com validação visual */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" placeholder="usuario@gestum.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                {newEmail && !newEmail.endsWith("@gestum.com") && (
                  <p className="text-xs text-destructive">O e-mail deve terminar com @gestum.com</p>
                )}
              </div>
              {/* Seletor de nível de acesso */}
              <div className="space-y-2">
                <Label>Nível de Acesso</Label>
                <Select value={newAccessLevel} onValueChange={setNewAccessLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCESS_LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating || !newEmail.endsWith("@gestum.com")}>
                {creating ? "Criando..." : "Criar Conta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── 6.2 — Cards de KPIs ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Contas</CardDescription>
            <CardTitle className="text-2xl">{accounts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Contas Ativas</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {accounts.filter((a) => a.is_active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vinculadas ao Chat</CardDescription>
            <CardTitle className="text-2xl text-primary">
              {accounts.filter((a) => a.is_linked_to_chat).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ── 6.3 — Tabela de contas de suporte ──────────────── */}
      <Card>
        <CardHeader><CardTitle>Contas de Suporte</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma conta de suporte cadastrada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chat ao Vivo</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    {/* E-mail da conta */}
                    <TableCell className="font-medium">{account.email}</TableCell>

                    {/* Nível de acesso com badge colorido */}
                    <TableCell>{getAccessBadge(account.access_level)}</TableCell>

                    {/* Toggle ativo/inativo */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={account.is_active} onCheckedChange={() => handleToggleActive(account)} />
                        <span className="text-sm">{account.is_active ? "Ativa" : "Inativa"}</span>
                      </div>
                    </TableCell>

                    {/* Toggle de vinculação ao chat */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={account.is_linked_to_chat} onCheckedChange={() => handleToggleChat(account)} />
                        <MessageSquare className={`h-4 w-4 ${account.is_linked_to_chat ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                    </TableCell>

                    {/* Data de criação relativa */}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(account.created_at), { addSuffix: true, locale: ptBR })}
                    </TableCell>

                    {/* Botões de ação: editar, auditoria, excluir */}
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {/* Editar nível de acesso */}
                        <Button variant="ghost" size="icon" onClick={() => { setEditAccount(account); setEditAccessLevel(account.access_level); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Ver histórico de auditoria */}
                        <Button variant="ghost" size="icon" onClick={() => setAuditAccountId(account.id)}>
                          <History className="h-4 w-4" />
                        </Button>

                        {/* Excluir com confirmação */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover conta de suporte?</AlertDialogTitle>
                              <AlertDialogDescription>A conta de {account.email} será removida permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(account.id)}>Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── 6.4 — Diálogo de edição de nível de acesso ─────── */}
      <Dialog open={!!editAccount} onOpenChange={(open) => !open && setEditAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nível de Acesso</DialogTitle>
            <DialogDescription>{editAccount?.email}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Nível de Acesso</Label>
            <Select value={editAccessLevel} onValueChange={setEditAccessLevel}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCESS_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAccount(null)}>Cancelar</Button>
            <Button onClick={handleEditSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 6.5 — Diálogo de auditoria ─────────────────────── */}
      <AuditDialog accountId={auditAccountId} onClose={() => setAuditAccountId(undefined)} />
    </div>
  );
}


// ============================
// SEÇÃO 7 — COMPONENTE AUXILIAR: AuditDialog
// ============================

/**
 * AuditDialog
 *
 * Diálogo que exibe o histórico de auditoria (log de alterações)
 * de uma conta de suporte específica.
 *
 * @param accountId - ID da conta cujo histórico será exibido (undefined = fechado)
 * @param onClose - Callback para fechar o diálogo
 * @returns JSX.Element — Diálogo com lista de registros de auditoria
 */
function AuditDialog({ accountId, onClose }: { accountId?: string; onClose: () => void }) {
  /** Hook que carrega os registros de auditoria da conta */
  const { entries, loading } = useSupportAuditLog(accountId);

  /** Mapeamento de ações técnicas para labels em português */
  const actionLabels: Record<string, string> = {
    create: "Criação",
    update: "Atualização",
    delete: "Remoção",
  };

  return (
    <Dialog open={!!accountId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de Alterações</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum registro</div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    {/* Badge com tipo de ação traduzida */}
                    <Badge variant="outline">{actionLabels[entry.action] || entry.action}</Badge>

                    {/* Data relativa do registro */}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>

                  {/* Valores novos do registro (JSON formatado) */}
                  {entry.new_values && (
                    <pre className="text-xs bg-muted rounded p-2 overflow-auto">
                      {JSON.stringify(entry.new_values, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ============================================================
 * RESUMO DO FLUXO COMPLETO
 * ============================================================
 *
 * 1. O componente verifica o papel do usuário ao montar
 * 2. Se não for "master" → exibe "Acesso Negado"
 * 3. Se for "master" → carrega as contas de suporte via hook
 * 4. Exibe KPIs resumidos (total, ativas, vinculadas ao chat)
 * 5. Lista contas em tabela com:
 *    a. Toggle de status (ativo/inativo)
 *    b. Toggle de vinculação ao chat ao vivo
 *    c. Botão de edição de nível de acesso
 *    d. Botão de histórico de auditoria
 *    e. Botão de exclusão com confirmação
 * 6. Criação de novas contas restritas a e-mails @gestum.com
 * 7. Todas as ações geram registros de auditoria automaticamente
 *
 * ============================================================
 */
