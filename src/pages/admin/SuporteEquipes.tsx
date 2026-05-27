/**
 * ============================================================
 * EQUIPES DE SUPORTE — SuporteEquipes.tsx
 * ============================================================
 *
 * Propósito:
 *   Página para criar e gerenciar equipes de suporte especializadas.
 *   Permite organizar atendentes em grupos (ex: Financeiro, Técnico),
 *   adicionar/remover membros e alterar suas funções dentro da equipe.
 *
 * Fluxo geral:
 *   1. Exibe lista de equipes no painel lateral
 *   2. Ao selecionar uma equipe, exibe seus membros na tabela principal
 *   3. Permite criar novas equipes com nome e descrição
 *   4. Permite adicionar membros a partir das contas de suporte ativas
 *   5. Permite alterar a função de cada membro (membro, supervisor, líder)
 *   6. Permite remover membros e excluir equipes inteiras
 *
 * ============================================================
 */

// ============================
// SEÇÃO 1 — IMPORTAÇÕES
// ============================

/** Hook do React para estado local */
import { useState } from "react";
import PageShell from "@/components/PageShell";

/** Componentes de UI do design system */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Ícones utilizados na interface */
import { Users, Plus, Trash2, UserPlus } from "lucide-react";

/** Notificações toast */
import { toast } from "sonner";

/** Hooks personalizados — CRUD de equipes e membros */
import { useSupportTeams, useTeamMembers } from "@/hooks/useSupportTeams";

/** Hook personalizado — contas de suporte (para listar atendentes disponíveis) */
import { useSupportAccounts } from "@/hooks/useSupportAccounts";


// ============================
// SEÇÃO 2 — CONSTANTES
// ============================

/**
 * MEMBER_ROLES
 * Funções que um membro pode exercer dentro de uma equipe.
 */
const MEMBER_ROLES = [
  { value: "member", label: "Membro" },         // Atendente regular
  { value: "supervisor", label: "Supervisor" },  // Supervisiona atendimentos
  { value: "lead", label: "Líder" },             // Lidera a equipe
];


// ============================
// SEÇÃO 3 — COMPONENTE PRINCIPAL
// ============================

/**
 * SuporteEquipes
 *
 * Interface de gerenciamento de equipes de suporte.
 * Layout dividido em duas colunas: lista de equipes (1/3)
 * e detalhes/membros da equipe selecionada (2/3).
 *
 * @returns JSX.Element — Página completa de equipes
 */
export default function SuporteEquipes() {

  // ── 3.1 — Hooks de dados ──────────────────────────────────

  /** CRUD de equipes de suporte */
  const { teams, loading, createTeam, deleteTeam } = useSupportTeams();

  /** Lista de contas de atendentes (para selecionar ao adicionar membro) */
  const { accounts } = useSupportAccounts();


  // ── 3.2 — Estado local ────────────────────────────────────

  /** Controla visibilidade do diálogo de criação de equipe */
  const [createOpen, setCreateOpen] = useState(false);

  /** Nome da nova equipe sendo criada */
  const [name, setName] = useState("");

  /** Descrição da nova equipe sendo criada */
  const [description, setDescription] = useState("");

  /** ID da equipe selecionada na lista lateral */
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();

  /** Controla visibilidade do diálogo de adição de membro */
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  /** ID do usuário a ser adicionado como membro */
  const [newMemberUserId, setNewMemberUserId] = useState("");

  /** Função do novo membro dentro da equipe */
  const [newMemberRole, setNewMemberRole] = useState("member");


  // ── 3.3 — Hook de membros da equipe selecionada ───────────

  /** CRUD de membros da equipe atualmente selecionada */
  const { members, addMember, updateMemberRole, removeMember } = useTeamMembers(selectedTeamId);


  // ============================
  // SEÇÃO 4 — FUNÇÕES AUXILIARES (HANDLERS)
  // ============================

  /**
   * handleCreate
   * Cria uma nova equipe de suporte com nome e descrição opcional.
   */
  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      await createTeam(name.trim(), description.trim() || undefined);
      toast.success("Equipe criada");
      setCreateOpen(false);
      setName("");
      setDescription("");
    } catch (e: any) { toast.error(e.message); }
  };

  /**
   * handleAddMember
   * Adiciona um atendente como membro da equipe selecionada.
   */
  const handleAddMember = async () => {
    if (!newMemberUserId) return;
    try {
      await addMember(newMemberUserId, newMemberRole);
      toast.success("Membro adicionado");
      setAddMemberOpen(false);
      setNewMemberUserId("");
      setNewMemberRole("member");
    } catch (e: any) { toast.error(e.message || "Erro ao adicionar"); }
  };

  /** Objeto da equipe atualmente selecionada (para exibir nome/descrição) */
  const selectedTeam = teams.find(t => t.id === selectedTeamId);


  // ============================
  // SEÇÃO 5 — RENDERIZAÇÃO (JSX)
  // ============================

  return (
    <PageShell
      accent="violet"
      eyebrow="Administração"
      title="Equipes de Suporte"
      subtitle="Organize atendentes em equipes especializadas."
      actions={
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Equipe</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Equipe</DialogTitle>
              <DialogDescription>Crie uma nova equipe de suporte.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Ex: Financeiro" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descrição da equipe" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
      {/* ── 5.2 — Layout de duas colunas ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Coluna 1: Lista de equipes ── */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Equipes</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-4">Carregando...</p>
            ) : teams.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma equipe criada</p>
            ) : (
              <div className="space-y-2">
                {teams.map(team => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${selectedTeamId === team.id ? "border-primary bg-primary/5" : "border-transparent bg-muted hover:bg-muted/80"}`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{team.name}</h3>

                      {/* Botão de exclusão com confirmação */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover equipe?</AlertDialogTitle>
                            <AlertDialogDescription>A equipe "{team.name}" será removida permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTeam(team.id)}>Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {team.description && <p className="text-xs text-muted-foreground mt-1">{team.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Coluna 2: Membros da equipe selecionada ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedTeam ? `Membros: ${selectedTeam.name}` : "Selecione uma equipe"}</CardTitle>
                {selectedTeam?.description && <CardDescription>{selectedTeam.description}</CardDescription>}
              </div>

              {/* Botão de adicionar membro (visível apenas com equipe selecionada) */}
              {selectedTeam && (
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Adicionar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Membro</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Seletor de conta de suporte ativa */}
                      <div className="space-y-2">
                        <Label>Conta de Suporte</Label>
                        <Select value={newMemberUserId} onValueChange={setNewMemberUserId}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {accounts.filter(a => a.is_active).map(a => (
                              <SelectItem key={a.user_id} value={a.user_id}>{a.email}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Seletor de função */}
                      <div className="space-y-2">
                        <Label>Função</Label>
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MEMBER_ROLES.map(r => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancelar</Button>
                      <Button onClick={handleAddMember} disabled={!newMemberUserId}>Adicionar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <p className="text-center text-muted-foreground py-12">Selecione uma equipe para ver os membros</p>
            ) : members.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum membro nesta equipe</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(m => {
                    /** Encontra o e-mail do membro na lista de contas */
                    const account = accounts.find(a => a.user_id === m.user_id);
                    return (
                      <TableRow key={m.id}>
                        {/* E-mail ou ID parcial do membro */}
                        <TableCell>{account?.email || m.user_id.slice(0, 8)}</TableCell>

                        {/* Seletor inline para alterar função */}
                        <TableCell>
                          <Select value={m.role} onValueChange={v => updateMemberRole(m.id, v)}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MEMBER_ROLES.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Botão de remoção */}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * ============================================================
 * RESUMO DO FLUXO COMPLETO
 * ============================================================
 *
 * 1. Ao abrir a página, carrega equipes e contas de suporte
 * 2. Painel lateral exibe todas as equipes existentes
 * 3. Ao clicar em uma equipe, carrega seus membros na tabela
 * 4. O administrador pode:
 *    a. Criar nova equipe (nome + descrição)
 *    b. Excluir equipe com confirmação
 *    c. Adicionar membro selecionando conta ativa + função
 *    d. Alterar função do membro inline (seletor na tabela)
 *    e. Remover membro da equipe
 * 5. Todas as ações exibem feedback via toast
 *
 * ============================================================
 */
