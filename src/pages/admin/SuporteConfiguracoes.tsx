/**
 * ============================================================
 * CONFIGURAÇÕES DO CHAT — SuporteConfiguracoes.tsx
 * ============================================================
 *
 * Propósito:
 *   Página para configurar aspectos do chat de suporte:
 *   - Tags (etiquetas) para categorizar atendimentos
 *   - Mensagens de boas-vindas automáticas
 *
 * Fluxo geral:
 *   1. Carrega tags existentes e mensagens de boas-vindas via hooks
 *   2. Permite criar/remover tags com nome e cor personalizada
 *   3. Permite criar mensagens de boas-vindas com:
 *      - Texto personalizável (suporta {{nome}} para nome do cliente)
 *      - Equipe específica ou todas as equipes
 *      - Horário de exibição (início e fim)
 *   4. Permite ativar/desativar e remover mensagens existentes
 *
 * ============================================================
 */

// ============================
// SEÇÃO 1 — IMPORTAÇÕES
// ============================

/** Hook do React para estado local */
import { useState } from "react";

/** Componentes de UI do design system */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/** Ícones utilizados na interface */
import { MessageSquareText, Plus, Trash2, Tag, Palette } from "lucide-react";

/** Notificações toast */
import { toast } from "sonner";

/** Hooks personalizados — tags e mensagens de boas-vindas */
import { useSupportTags, useWelcomeMessages } from "@/hooks/useSupportAdvanced";

/** Hook personalizado — equipes (para associar mensagem a equipe) */
import { useSupportTeams } from "@/hooks/useSupportTeams";


// ============================
// SEÇÃO 2 — CONSTANTES
// ============================

/**
 * TAG_COLORS
 * Paleta de cores disponíveis para etiquetas.
 * Cada cor é um código hexadecimal que será exibido como
 * botão circular selecionável no diálogo de criação.
 */
const TAG_COLORS = [
  "#ef4444", // Vermelho
  "#f97316", // Laranja
  "#eab308", // Amarelo
  "#22c55e", // Verde
  "#06b6d4", // Ciano
  "#3b82f6", // Azul
  "#6366f1", // Índigo
  "#8b5cf6", // Violeta
  "#ec4899", // Rosa
];


// ============================
// SEÇÃO 3 — COMPONENTE PRINCIPAL
// ============================

/**
 * SuporteConfiguracoes
 *
 * Interface de configuração de tags e mensagens de boas-vindas
 * do sistema de suporte ao cliente.
 *
 * @returns JSX.Element — Página de configurações do chat
 */
export default function SuporteConfiguracoes() {

  // ── 3.1 — Hooks de dados ──────────────────────────────────

  /** CRUD de tags (etiquetas) para categorizar atendimentos */
  const { tags, createTag, deleteTag } = useSupportTags();

  /** CRUD de mensagens de boas-vindas automáticas */
  const { messages: welcomeMessages, createMessage, updateMessage, deleteMessage } = useWelcomeMessages();

  /** Lista de equipes (para associar mensagem a equipe específica) */
  const { teams } = useSupportTeams();


  // ── 3.2 — Estado do diálogo de criação de tag ─────────────

  /** Controla visibilidade do diálogo de criação de tag */
  const [tagOpen, setTagOpen] = useState(false);

  /** Nome da nova tag */
  const [tagName, setTagName] = useState("");

  /** Cor selecionada para a nova tag (padrão: índigo) */
  const [tagColor, setTagColor] = useState("#6366f1");


  // ── 3.3 — Estado do diálogo de mensagem de boas-vindas ────

  /** Controla visibilidade do diálogo de criação de mensagem */
  const [wmOpen, setWmOpen] = useState(false);

  /** Texto da mensagem de boas-vindas */
  const [wmMessage, setWmMessage] = useState("");

  /** ID da equipe associada ("none" = todas as equipes) */
  const [wmTeamId, setWmTeamId] = useState<string>("none");

  /** Horário de início para exibição da mensagem */
  const [wmStart, setWmStart] = useState("");

  /** Horário de fim para exibição da mensagem */
  const [wmEnd, setWmEnd] = useState("");


  // ============================
  // SEÇÃO 4 — FUNÇÕES AUXILIARES (HANDLERS)
  // ============================

  /**
   * handleCreateTag
   * Cria uma nova tag com o nome e cor selecionados.
   * Valida que o nome não está vazio antes de prosseguir.
   */
  const handleCreateTag = async () => {
    if (!tagName.trim()) { toast.error("Nome obrigatório"); return; }
    try {
      await createTag(tagName.trim(), tagColor);
      toast.success("Tag criada");
      setTagOpen(false);
      setTagName("");
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };

  /**
   * handleCreateWelcome
   * Cria uma nova mensagem de boas-vindas com:
   * - Texto da mensagem (obrigatório)
   * - Equipe associada (opcional, "none" = todas)
   * - Horário de exibição (opcional)
   */
  const handleCreateWelcome = async () => {
    if (!wmMessage.trim()) { toast.error("Mensagem obrigatória"); return; }
    try {
      await createMessage({
        message: wmMessage.trim(),
        team_id: wmTeamId === "none" ? null : wmTeamId,
        schedule_start: wmStart || null,
        schedule_end: wmEnd || null,
      });
      toast.success("Mensagem criada");

      /** Limpa todos os campos do formulário */
      setWmOpen(false);
      setWmMessage("");
      setWmTeamId("none");
      setWmStart("");
      setWmEnd("");
    } catch (e: any) { toast.error(e.message || "Erro"); }
  };


  // ============================
  // SEÇÃO 5 — RENDERIZAÇÃO (JSX)
  // ============================

  return (
    <PageShell
      accent="violet"
      eyebrow="Administração"
      title="Configurações do Chat"
      subtitle="Tags e mensagens de boas-vindas."
    >
      <div className="space-y-6">
      {/* ── 5.2 — Seção de Tags (Etiquetas) ────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Etiquetas (Tags)</CardTitle>
              <CardDescription>Tags para categorizar atendimentos</CardDescription>
            </div>

            {/* Diálogo de criação de tag */}
            <Dialog open={tagOpen} onOpenChange={setTagOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Tag</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Tag</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Campo de nome da tag */}
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="Ex: urgente" value={tagName} onChange={e => setTagName(e.target.value)} />
                  </div>

                  {/* Seletor de cor (botões circulares coloridos) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Palette className="h-3 w-3" /> Cor</Label>
                    <div className="flex gap-2 flex-wrap">
                      {TAG_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setTagColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${tagColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTagOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateTag}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma tag criada</p>
          ) : (
            /* Lista horizontal de tags com botão de exclusão */
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-1 border rounded-full px-3 py-1.5">
                  {/* Bolinha colorida representando a cor da tag */}
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="text-sm">{tag.name}</span>

                  {/* Botão de exclusão */}
                  <button onClick={() => { deleteTag(tag.id); toast.success("Tag removida"); }} className="ml-1 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 5.3 — Seção de Mensagens de Boas-vindas ────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mensagens de Boas-vindas</CardTitle>
              <CardDescription>Mensagens automáticas no início do chat. Use {"{{nome}}"} para o nome do cliente.</CardDescription>
            </div>

            {/* Diálogo de criação de mensagem */}
            <Dialog open={wmOpen} onOpenChange={setWmOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Mensagem</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Mensagem de Boas-vindas</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Texto da mensagem */}
                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea placeholder="Olá {{nome}}, como podemos ajudar?" value={wmMessage} onChange={e => setWmMessage(e.target.value)} />
                  </div>

                  {/* Equipe associada (opcional) */}
                  <div className="space-y-2">
                    <Label>Equipe (opcional)</Label>
                    <Select value={wmTeamId} onValueChange={setWmTeamId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Todas as equipes</SelectItem>
                        {teams.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Horário de exibição (início e fim) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horário início</Label>
                      <Input type="time" value={wmStart} onChange={e => setWmStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário fim</Label>
                      <Input type="time" value={wmEnd} onChange={e => setWmEnd(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWmOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateWelcome}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {welcomeMessages.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma mensagem configurada</p>
          ) : (
            /* Lista de mensagens existentes com toggle e exclusão */
            <div className="space-y-3">
              {welcomeMessages.map(wm => {
                /** Encontra o nome da equipe associada (se houver) */
                const team = teams.find(t => t.id === wm.team_id);
                return (
                  <div key={wm.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Texto da mensagem */}
                        <p className="text-sm">{wm.message}</p>

                        {/* Badges de equipe e horário */}
                        <div className="flex gap-2 mt-2">
                          {team && <Badge variant="outline">{team.name}</Badge>}
                          {wm.schedule_start && wm.schedule_end && (
                            <Badge variant="secondary">{wm.schedule_start} - {wm.schedule_end}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Toggle ativo/inativo */}
                        <Switch
                          checked={wm.is_active}
                          onCheckedChange={v => updateMessage(wm.id, { is_active: v })}
                        />

                        {/* Botão de exclusão */}
                        <Button variant="ghost" size="icon" onClick={() => { deleteMessage(wm.id); toast.success("Removida"); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ============================================================
 * RESUMO DO FLUXO COMPLETO
 * ============================================================
 *
 * 1. Ao abrir, carrega tags, mensagens de boas-vindas e equipes
 * 2. Seção de Tags:
 *    a. Exibe todas as tags como chips coloridos
 *    b. Botão "Nova Tag" abre diálogo com nome + seletor de cor
 *    c. Cada tag tem botão de exclusão inline
 * 3. Seção de Mensagens de Boas-vindas:
 *    a. Exibe mensagens com texto, equipe e horário
 *    b. Toggle inline para ativar/desativar cada mensagem
 *    c. Botão "Nova Mensagem" abre diálogo com:
 *       - Campo de texto (suporta {{nome}})
 *       - Seletor de equipe (opcional)
 *       - Campos de horário início/fim (opcionais)
 *    d. Botão de exclusão em cada mensagem
 * 4. Todas as ações exibem feedback via toast
 *
 * ============================================================
 */
