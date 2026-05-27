/**
 * ============================================================
 * RELATÓRIOS DE SUPORTE — SuporteRelatorios.tsx
 * ============================================================
 *
 * Propósito:
 *   Página de relatórios e métricas do suporte ao cliente.
 *   Exibe KPIs de desempenho (total de atendimentos, tempo médio
 *   de resposta, taxa de transferência) e distribuição por equipe/tag.
 *   Permite exportar os dados em PDF.
 *
 * Fluxo geral:
 *   1. Carrega métricas consolidadas via hook useSupportMetrics
 *   2. Exibe 5 cards de KPIs no topo
 *   3. Exibe duas tabelas: atendimentos por equipe e por tag
 *   4. Botão "Exportar PDF" gera um relatório formatado com jsPDF
 *
 * ============================================================
 */

// ============================
// SEÇÃO 1 — IMPORTAÇÕES
// ============================

/** Componentes de UI do design system */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Ícones utilizados nos KPIs e tabelas */
import { BarChart3, Clock, MessageSquare, ArrowRightLeft, Tag, Download } from "lucide-react";

/** Hook personalizado — métricas consolidadas do suporte */
import { useSupportMetrics } from "@/hooks/useSupportAdvanced";
import PageShell from "@/components/PageShell";

/** Biblioteca para geração de PDF */
import jsPDF from "jspdf";

/** Plugin para tabelas automáticas em PDF */
import autoTable from "jspdf-autotable";


// ============================
// SEÇÃO 2 — COMPONENTE PRINCIPAL
// ============================

/**
 * SuporteRelatorios
 *
 * Página de relatórios de suporte com KPIs, distribuição
 * por equipe/tag e exportação em PDF.
 *
 * @returns JSX.Element — Interface de relatórios de suporte
 */
export default function SuporteRelatorios() {

  // ── 2.1 — Carregamento de métricas ────────────────────────

  /** Métricas consolidadas do suporte e estado de carregamento */
  const { metrics, loading } = useSupportMetrics();


  // ============================
  // SEÇÃO 3 — FUNÇÃO DE EXPORTAÇÃO PDF
  // ============================

  /**
   * exportPDF
   * Gera e baixa um relatório em PDF com:
   * - Cabeçalho com título e data
   * - Tabela de indicadores gerais (KPIs)
   * - Tabela de atendimentos por tag (se houver dados)
   *
   * Utiliza jsPDF para criar o documento e jspdf-autotable
   * para renderizar tabelas formatadas automaticamente.
   */
  const exportPDF = () => {
    if (!metrics) return;

    /** Cria novo documento PDF em formato A4 */
    const doc = new jsPDF();

    /** Título principal do relatório */
    doc.setFontSize(18);
    doc.text("Relatório de Suporte - GESTUM", 14, 20);

    /** Data de geração do relatório */
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 28);

    /** Seção de indicadores gerais */
    doc.setFontSize(12);
    doc.text("Indicadores Gerais", 14, 40);

    /** Tabela com os KPIs principais */
    autoTable(doc, {
      startY: 45,
      head: [["Métrica", "Valor"]],
      body: [
        ["Total de Atendimentos", String(metrics.totalConversations)],
        ["Atendimentos Abertos", String(metrics.openConversations)],
        ["Tempo Médio 1ª Resposta (min)", String(metrics.avgFirstResponseMinutes)],
        ["Tempo Médio Resolução (min)", String(metrics.avgResolutionMinutes)],
        ["Taxa de Transferência", `${metrics.transferRate}%`],
      ],
    });

    /** Seção de atendimentos por tag (se existirem dados) */
    if (metrics.chatsByTag.length > 0) {
      /** Obtém a posição Y final da tabela anterior para posicionar a próxima */
      const lastY = (doc as any).lastAutoTable?.finalY || 100;
      doc.text("Atendimentos por Tag", 14, lastY + 10);

      /** Tabela com distribuição por tag */
      autoTable(doc, {
        startY: lastY + 15,
        head: [["Tag", "Quantidade"]],
        body: metrics.chatsByTag.map(t => [t.tagName, String(t.count)]),
      });
    }

    /** Salva o arquivo PDF com timestamp no nome */
    doc.save(`relatorio-suporte-${Date.now()}.pdf`);
  };


  // ============================
  // SEÇÃO 4 — ESTADOS DE CARREGAMENTO E VAZIO
  // ============================

  /** Exibe indicador de carregamento enquanto as métricas são obtidas */
  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Carregando métricas...</div>;
  }

  /** Se não houver métricas (erro ou dados inexistentes), não renderiza nada */
  if (!metrics) return null;


  // ============================
  // SEÇÃO 5 — RENDERIZAÇÃO (JSX)
  // ============================

  return (
    <PageShell
      accent="rose"
      eyebrow="Administração"
      title="Relatórios de Suporte"
      subtitle="Métricas e indicadores de desempenho."
      actions={<Button onClick={exportPDF}><Download className="h-4 w-4 mr-2" />Exportar PDF</Button>}
    >
      <div className="space-y-6">
      {/* ── 5.2 — Cards de KPIs ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Total de atendimentos */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Total</CardDescription>
            <CardTitle className="text-2xl">{metrics.totalConversations}</CardTitle>
          </CardHeader>
        </Card>

        {/* Atendimentos em aberto */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Abertos</CardDescription>
            <CardTitle className="text-2xl text-primary">{metrics.openConversations}</CardTitle>
          </CardHeader>
        </Card>

        {/* Tempo médio da primeira resposta */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" /> 1ª Resposta (min)</CardDescription>
            <CardTitle className="text-2xl">{metrics.avgFirstResponseMinutes}</CardTitle>
          </CardHeader>
        </Card>

        {/* Tempo médio de resolução */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" /> Resolução (min)</CardDescription>
            <CardTitle className="text-2xl">{metrics.avgResolutionMinutes}</CardTitle>
          </CardHeader>
        </Card>

        {/* Taxa de transferência */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><ArrowRightLeft className="h-3 w-3" /> Transferências</CardDescription>
            <CardTitle className="text-2xl">{metrics.transferRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ── 5.3 — Tabelas de distribuição ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Atendimentos por equipe */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atendimentos por Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.chatsByTeam.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {metrics.chatsByTeam.map(t => (
                  <div key={t.teamId} className="flex items-center justify-between">
                    <span className="font-medium">{t.teamName}</span>
                    <Badge variant="secondary">{t.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atendimentos por tag */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Tag className="h-4 w-4" /> Atendimentos por Tag</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.chatsByTag.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {metrics.chatsByTag.map(t => (
                  <div key={t.tagName} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Bolinha colorida representando a cor da tag */}
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.tagColor }} />
                      <span>{t.tagName}</span>
                    </div>
                    <Badge variant="secondary">{t.count}</Badge>
                  </div>
                ))}
              </div>
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
 * 1. Hook useSupportMetrics carrega dados consolidados do backend
 * 2. Enquanto carrega → exibe "Carregando métricas..."
 * 3. Após carregar → renderiza:
 *    a. 5 cards de KPIs (total, abertos, 1ª resposta, resolução, transferências)
 *    b. Tabela de distribuição por equipe
 *    c. Tabela de distribuição por tag (com cores visuais)
 * 4. Botão "Exportar PDF" gera documento com jsPDF contendo:
 *    a. Cabeçalho com título e data
 *    b. Tabela de KPIs
 *    c. Tabela de tags (se houver dados)
 *    d. Download automático do arquivo
 *
 * ============================================================
 */
