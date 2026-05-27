/**
 * ============================================================
 * PAINEL DE SUPORTE ADMINISTRATIVO - AdminSuportePanel.tsx
 * ============================================================
 *
 * Propósito:
 *   Página principal do painel de atendimento ao cliente.
 *   Permite que atendentes (support), administradores (admin) e
 *   o administrador geral (master) visualizem e respondam conversas
 *   de suporte em tempo real, gerenciem tags, transfiram chats
 *   e registrem notas internas.
 *
 * Fluxo geral:
 *   1. Verifica se o usuário autenticado possui papel (role) de suporte/admin/master
 *   2. Lista as conversas divididas por status (aberto, em andamento, fechado)
 *   3. Ao selecionar uma conversa, exibe o histórico de mensagens
 *   4. O atendente pode enviar mensagens públicas ou notas internas
 *   5. O atendente pode transferir o chat para outro atendente ou equipe
 *   6. O atendente pode alterar status, prioridade e tags da conversa
 *
 * ============================================================
 */

// ============================
// SEÇÃO 1 — IMPORTAÇÕES
// ============================

/** Hooks do React para estado local e efeitos colaterais */
import { useState, useEffect } from "react";
import PageShell from "@/components/PageShell";

/** Cliente do backend para consultas diretas (autenticação e atualizações pontuais) */
import { supabase } from "@/integrations/supabase/client";

/** Componentes de UI do design system */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

/** Ícones utilizados na interface */
import {
  MessageSquare, Send, Clock, CheckCircle2, AlertCircle, ArrowRightLeft,
  StickyNote, Tag, X,
} from "lucide-react";

/** Função para exibir notificações toast */
import { toast } from "sonner";

/** Hook personalizado — conversas e mensagens de suporte */
import { useSupportConversations, useSupportMessages } from "@/hooks/useSupportConversations";

/** Hooks personalizados — funcionalidades avançadas do suporte */
import {
  useInternalNotes, useChatTransfers, useSupportTags, useConversationTags,
} from "@/hooks/useSupportAdvanced";

/** Hook personalizado — equipes de suporte */
import { useSupportTeams } from "@/hooks/useSupportTeams";

/** Hook personalizado — contas de atendentes */
import { useSupportAccounts } from "@/hooks/useSupportAccounts";

/** Utilitário para exibir datas relativas ("há 5 min") em português */
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";


// ============================
// SEÇÃO 2 — COMPONENTE PRINCIPAL
// ============================

/**
 * AdminSuportePanel
 *
 * Componente principal da página de suporte administrativo.
 * Reúne lista de conversas, área de chat, notas internas,
 * transferência e gerenciamento de tags/status/prioridade.
 *
 * @returns JSX.Element — A interface completa do painel de suporte
 */
export default function AdminSuportePanel() {

  // ── 2.1 — Estado local ────────────────────────────────────

  /** ID da conversa atualmente selecionada na lista lateral */
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  /** Texto da mensagem pública sendo digitada */
  const [newMessage, setNewMessage] = useState("");

  /** Papel (role) do usuário autenticado: "support" | "admin" | "master" | null */
  const [userRole, setUserRole] = useState<string | null>(null);

  /** Modo do chat: "public" para mensagens ao cliente, "internal" para notas internas */
  const [chatMode, setChatMode] = useState<"public" | "internal">("public");

  /** Texto da nota interna sendo digitada */
  const [internalMsg, setInternalMsg] = useState("");

  /** Filtro de tag selecionado (atualmente reservado para implementação futura) */
  const [filterTag, setFilterTag] = useState<string>("all");

  // ── 2.2 — Estado do diálogo de transferência ──────────────

  /** Controla se o diálogo de transferência está aberto */
  const [transferOpen, setTransferOpen] = useState(false);

  /** ID do atendente destino da transferência */
  const [transferToUser, setTransferToUser] = useState("");

  /** ID da equipe destino da transferência */
  const [transferToTeam, setTransferToTeam] = useState("");

  /** Motivo textual da transferência */
  const [transferReason, setTransferReason] = useState("");


  // ── 2.3 — Hooks de dados ──────────────────────────────────

  /** Lista de todas as conversas de suporte + estado de carregamento */
  const { conversations, loading: conversationsLoading } = useSupportConversations();

  /** Mensagens da conversa selecionada + função para enviar nova mensagem */
  const { messages, loading: messagesLoading, sendMessage } = useSupportMessages(selectedConversationId);

  /** Notas internas da conversa selecionada + função para enviar nota */
  const { notes, sendNote } = useInternalNotes(selectedConversationId);

  /** Histórico de transferências da conversa + função para transferir */
  const { transfers, transferChat } = useChatTransfers(selectedConversationId);

  /** Lista global de tags disponíveis */
  const { tags } = useSupportTags();

  /** Tags associadas à conversa selecionada + funções de adicionar/remover */
  const { conversationTags, addTag, removeTag } = useConversationTags(selectedConversationId);

  /** Lista de equipes de suporte */
  const { teams } = useSupportTeams();

  /** Lista de contas de atendentes cadastradas */
  const { accounts } = useSupportAccounts();


  // ── 2.4 — Verificação de papel do usuário ─────────────────

  /**
   * Ao montar o componente, consulta o papel (role) do usuário
   * autenticado na tabela user_roles para determinar se ele
   * tem permissão de acessar o painel.
   */
  useEffect(() => {
    const checkRole = async () => {
      /** Obtém o usuário autenticado no momento */
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      /** Consulta o papel do usuário na tabela user_roles */
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();

      /** Armazena o papel no estado local */
      setUserRole(data?.role || null);
    };
    checkRole();
  }, []);


  // ============================
  // SEÇÃO 3 — FUNÇÕES AUXILIARES (HANDLERS)
  // ============================

  /**
   * handleSendMessage
   * Envia uma mensagem pública (visível ao cliente) na conversa selecionada.
   * Marca a mensagem como is_staff = true.
   */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    try {
      await sendMessage(newMessage, true);
      setNewMessage("");
    } catch { toast.error("Erro ao enviar"); }
  };

  /**
   * handleSendInternalNote
   * Envia uma nota interna (visível apenas para a equipe de suporte).
   * Notas internas não são vistas pelo cliente.
   */
  const handleSendInternalNote = async () => {
    if (!internalMsg.trim() || !selectedConversationId) return;
    try {
      await sendNote(internalMsg);
      setInternalMsg("");
      toast.success("Nota interna enviada");
    } catch { toast.error("Erro ao enviar nota"); }
  };

  /**
   * handleTransfer
   * Transfere a conversa selecionada para outro atendente e/ou equipe.
   * Valida que pelo menos um destino (atendente ou equipe) foi selecionado.
   */
  const handleTransfer = async () => {
    if (!transferToUser && !transferToTeam) { toast.error("Selecione destino"); return; }
    try {
      await transferChat(
        transferToUser || null,  // ID do atendente destino (ou null)
        transferToTeam || null,  // ID da equipe destino (ou null)
        transferReason || undefined // Motivo textual opcional
      );
      toast.success("Chat transferido");

      /** Limpa o estado do diálogo de transferência */
      setTransferOpen(false);
      setTransferToUser("");
      setTransferToTeam("");
      setTransferReason("");
    } catch { toast.error("Erro na transferência"); }
  };

  /**
   * handleStatusChange
   * Atualiza o status de uma conversa (open → in_progress → closed).
   * Quando fechada, registra automaticamente o timestamp de fechamento.
   *
   * @param id - ID da conversa a ser atualizada
   * @param status - Novo status: "open" | "in_progress" | "closed"
   */
  const handleStatusChange = async (id: string, status: string) => {
    const updates: any = { status };
    /** Se estiver fechando, registra a data/hora do fechamento */
    if (status === "closed") updates.closed_at = new Date().toISOString();
    await supabase.from("support_conversations").update(updates).eq("id", id);
  };

  /**
   * handlePriorityChange
   * Atualiza a prioridade de uma conversa.
   *
   * @param id - ID da conversa
   * @param priority - Nova prioridade: "low" | "normal" | "high"
   */
  const handlePriorityChange = async (id: string, priority: string) => {
    await supabase.from("support_conversations").update({ priority }).eq("id", id);
  };


  // ============================
  // SEÇÃO 4 — CONTROLE DE ACESSO
  // ============================

  /**
   * Se o papel do usuário não for suporte, admin ou master,
   * exibe uma tela de "Acesso Negado" em vez do painel.
   */
  if (!userRole || !["support", "admin", "master"].includes(userRole)) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle className="text-center">Acesso Negado</CardTitle></CardHeader>
          <CardContent><p className="text-center text-muted-foreground">Sem permissão.</p></CardContent>
        </Card>
      </div>
    );
  }


  // ============================
  // SEÇÃO 5 — VARIÁVEIS DERIVADAS
  // ============================

  /** Objeto da conversa atualmente selecionada (ou undefined se nenhuma) */
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  /** Conversas filtradas (filtro de tag reservado para implementação futura) */
  const filteredConversations = filterTag === "all"
    ? conversations
    : conversations;

  /**
   * getStatusBadge
   * Retorna um componente Badge estilizado conforme o status da conversa.
   *
   * @param status - "open" | "in_progress" | "closed"
   * @returns JSX.Element — Badge com ícone e texto traduzido
   */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: "default" as const, icon: AlertCircle, label: "Aberto" },
      in_progress: { variant: "secondary" as const, icon: Clock, label: "Em andamento" },
      closed: { variant: "outline" as const, icon: CheckCircle2, label: "Fechado" },
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    return <Badge variant={config.variant}><Icon className="w-3 h-3 mr-1" />{config.label}</Badge>;
  };

  /**
   * getPriorityBadge
   * Retorna um componente Badge estilizado conforme a prioridade da conversa.
   *
   * @param priority - "low" | "normal" | "high"
   * @returns JSX.Element — Badge colorido com texto traduzido
   */
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: { variant: "secondary" as const, label: "Baixa" },
      normal: { variant: "default" as const, label: "Normal" },
      high: { variant: "destructive" as const, label: "Alta" },
    };
    const config = variants[priority] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /** IDs das tags já associadas à conversa selecionada */
  const selectedConvoTagIds = conversationTags.map(ct => ct.tag_id);

  /** Tags disponíveis para adicionar (exclui as já associadas) */
  const availableTags = tags.filter(t => !selectedConvoTagIds.includes(t.id));


  // ============================
  // SEÇÃO 6 — RENDERIZAÇÃO (JSX)
  // ============================

  return (
    <PageShell accent="violet" eyebrow="Atendimento" title="Painel de Suporte" subtitle="Gerencie conversas, tags e transferências em tempo real.">
      <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── 6.2 — Lista lateral de conversas ─────────────── */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Conversas</CardTitle></CardHeader>
          <CardContent className="p-0">

            {/* Abas para filtrar por status */}
            <Tabs defaultValue="open" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="open">Abertos</TabsTrigger>
                <TabsTrigger value="in_progress">Andamento</TabsTrigger>
                <TabsTrigger value="closed">Fechados</TabsTrigger>
              </TabsList>

              {/* Itera por cada status e renderiza a lista correspondente */}
              {["open", "in_progress", "closed"].map(status => (
                <TabsContent key={status} value={status} className="m-0">
                  <ScrollArea className="h-[600px]">
                    {conversationsLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Carregando...</div>
                    ) : (
                      <div className="space-y-2 p-4">
                        {/* Renderiza cada conversa com o status correspondente */}
                        {filteredConversations.filter(c => c.status === status).map(conv => (
                          <div
                            key={conv.id}
                            onClick={() => setSelectedConversationId(conv.id)}
                            className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedConversationId === conv.id ? "bg-primary/10 border-2 border-primary" : "bg-muted hover:bg-muted/80 border-2 border-transparent"}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-sm line-clamp-1">{conv.subject}</h3>
                              {getPriorityBadge(conv.priority)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.created_at || ""), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        ))}

                        {/* Mensagem quando não há conversas neste status */}
                        {filteredConversations.filter(c => c.status === status).length === 0 && (
                          <p className="text-center text-muted-foreground py-8">Nenhuma conversa</p>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* ── 6.3 — Área de chat (lado direito) ────────────── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            {selectedConversation ? (
              <div className="space-y-4">

                {/* Título e botão de transferência */}
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedConversation.subject}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConversation.status)}

                    {/* ── Diálogo de transferência de chat ── */}
                    <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><ArrowRightLeft className="h-4 w-4 mr-1" />Transferir</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Transferir Chat</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">

                          {/* Seleção de atendente destino */}
                          <div className="space-y-2">
                            <Label>Para Atendente</Label>
                            <Select value={transferToUser} onValueChange={setTransferToUser}>
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {accounts.filter(a => a.is_active && a.is_linked_to_chat).map(a => (
                                  <SelectItem key={a.user_id} value={a.user_id}>{a.email}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Seleção de equipe destino */}
                          <div className="space-y-2">
                            <Label>Para Equipe</Label>
                            <Select value={transferToTeam} onValueChange={setTransferToTeam}>
                              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                {teams.map(t => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Campo para motivo da transferência */}
                          <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input placeholder="Motivo da transferência" value={transferReason} onChange={e => setTransferReason(e.target.value)} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancelar</Button>
                          <Button onClick={handleTransfer}>Transferir</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* ── Controles de status e prioridade ── */}
                <div className="flex gap-4">
                  {/* Seletor de status */}
                  <Select value={selectedConversation.status} onValueChange={v => handleStatusChange(selectedConversation.id, v)}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Seletor de prioridade */}
                  <Select value={selectedConversation.priority} onValueChange={v => handlePriorityChange(selectedConversation.id, v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ── Tags da conversa ── */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-muted-foreground" />

                  {/* Tags já associadas à conversa (com botão de remover) */}
                  {conversationTags.map(ct => {
                    const tag = tags.find(t => t.id === ct.tag_id);
                    if (!tag) return null;
                    return (
                      <Badge key={ct.id} variant="outline" className="gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                        <button onClick={() => removeTag(ct.tag_id)}><X className="h-3 w-3" /></button>
                      </Badge>
                    );
                  })}

                  {/* Seletor para adicionar novas tags */}
                  {availableTags.length > 0 && (
                    <Select onValueChange={v => addTag(v)}>
                      <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue placeholder="+ Tag" /></SelectTrigger>
                      <SelectContent>
                        {availableTags.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                              {t.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* ── Indicador de transferências realizadas ── */}
                {transfers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRightLeft className="h-3 w-3" />
                    {transfers.length} transferência(s) realizada(s)
                  </div>
                )}
              </div>
            ) : (
              <CardTitle>Selecione uma conversa</CardTitle>
            )}
          </CardHeader>

          <CardContent>
            {selectedConversationId ? (
              <div className="space-y-4">

                {/* ── Alternância entre Chat Público e Notas Internas ── */}
                <div className="flex gap-2">
                  <Button
                    variant={chatMode === "public" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChatMode("public")}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />Chat
                  </Button>
                  <Button
                    variant={chatMode === "internal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChatMode("internal")}
                  >
                    <StickyNote className="h-3 w-3 mr-1" />Notas Internas
                  </Button>
                </div>

                {/* ── Modo: Chat Público ── */}
                {chatMode === "public" ? (
                  <>
                    {/* Área de exibição das mensagens */}
                    <ScrollArea className="h-[380px] border rounded-lg p-4 bg-muted/20">
                      {messagesLoading ? (
                        <div className="text-center text-muted-foreground">Carregando...</div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.is_staff ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.is_staff ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Campo de entrada e botão de envio */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Responder ao cliente..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        className="flex-1 min-h-[60px]"
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="self-end">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  /* ── Modo: Notas Internas ── */
                  <>
                    {/* Área de exibição das notas internas */}
                    <ScrollArea className="h-[380px] border rounded-lg p-4 bg-accent/20">
                      <div className="space-y-3">
                        {notes.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">Nenhuma nota interna</p>
                        ) : notes.map(note => (
                          <div key={note.id} className="bg-accent/30 border border-accent rounded-lg px-4 py-2">
                            <p className="text-sm whitespace-pre-wrap">{note.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Campo de entrada para nota interna */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Nota interna (não visível ao cliente)..."
                        value={internalMsg}
                        onChange={e => setInternalMsg(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendInternalNote(); } }}
                        className="flex-1 min-h-[60px] border-accent"
                      />
                      <Button variant="secondary" onClick={handleSendInternalNote} disabled={!internalMsg.trim()} className="self-end">
                        <StickyNote className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Aviso de visibilidade */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <StickyNote className="h-3 w-3" /> Notas internas são visíveis apenas para a equipe de suporte
                    </p>
                  </>
                )}
              </div>
            ) : (
              /* Estado vazio: nenhuma conversa selecionada */
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                Selecione uma conversa para começar
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </PageShell>
  );
}

/**
 * ============================================================
 * RESUMO DO FLUXO COMPLETO
 * ============================================================
 *
 * 1. O componente monta e verifica o papel do usuário via user_roles
 * 2. Se não autorizado → exibe "Acesso Negado"
 * 3. Se autorizado → carrega conversas, tags, equipes e contas
 * 4. A lista lateral exibe conversas agrupadas por status (abas)
 * 5. Ao clicar em uma conversa, a área de chat é populada
 * 6. O atendente pode:
 *    a. Enviar mensagens públicas ao cliente
 *    b. Enviar notas internas para a equipe
 *    c. Alterar status (aberto → andamento → fechado)
 *    d. Alterar prioridade (baixa, normal, alta)
 *    e. Adicionar/remover tags
 *    f. Transferir o chat para outro atendente ou equipe
 * 7. Todas as ações comunicam sucesso/erro via toast
 * 8. Mensagens e notas são atualizadas em tempo real via Realtime
 *
 * ============================================================
 */
