import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, HelpCircle, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupportMessages } from "@/hooks/useSupportConversations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const faqItems = [
  {
    question: "Como cadastrar um novo produto?",
    answer:
      "Para cadastrar um produto, acesse o menu 'Produtos' na barra lateral e clique no botão 'Adicionar Produto'. Preencha as informações de nome, preço, quantidade e categoria, depois clique em 'Salvar'.",
  },
  {
    question: "Como registrar uma venda?",
    answer:
      "Vá para 'Nova Venda' no menu, selecione os produtos desejados, ajuste as quantidades e escolha a forma de pagamento. Clique em 'Finalizar Venda' para concluir.",
  },
  {
    question: "Como gerar uma cobrança Pix?",
    answer:
      "Acesse 'Pix' no menu lateral, preencha o valor, descrição e dados do cliente. O sistema irá gerar automaticamente um código Pix e QR Code para pagamento.",
  },
  {
    question: "Como controlar o estoque?",
    answer:
      "O estoque é atualizado automaticamente a cada venda. Você pode visualizar e editar manualmente no menu 'Estoque', onde também receberá alertas quando o estoque estiver baixo.",
  },
  {
    question: "Como funciona a Caderneta Digital?",
    answer:
      "A Caderneta permite registrar vendas a prazo e controlar dívidas de clientes. Cadastre clientes, registre compras fiado e acompanhe pagamentos realizados.",
  },
  {
    question: "Como acompanhar minhas contas a pagar?",
    answer:
      "No menu 'Contas a Pagar', você pode registrar todas as despesas do seu negócio, definir datas de vencimento e marcar como pago quando efetuar o pagamento.",
  },
  {
    question: "O que é o Fluxo de Caixa?",
    answer:
      "O Fluxo de Caixa registra todas as entradas e saídas de dinheiro do seu negócio, permitindo acompanhar a saúde financeira em tempo real.",
  },
  {
    question: "Como visualizar relatórios de vendas?",
    answer:
      "Acesse 'Relatórios' no menu para ver gráficos e análises de vendas por período, produtos mais vendidos, formas de pagamento e muito mais.",
  },
];

export default function Suporte() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(true);
  const { messages, sendMessage } = useSupportMessages(conversationId);

  useEffect(() => {
    loadUserConversation();
  }, []);

  const loadUserConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConversationId(data.id);
        setShowNewConversation(false);
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    }
  };

  const handleStartConversation = async () => {
    if (!subject.trim()) {
      toast.error("Por favor, digite o assunto da sua dúvida");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('support_conversations')
        .insert({
          user_id: user.id,
          subject: subject,
          status: 'open',
          priority: 'normal'
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(data.id);
      setShowNewConversation(false);
      toast.success("Conversa iniciada com sucesso!");
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error("Erro ao iniciar conversa");
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId) return;

    try {
      await sendMessage(message, false);
      setMessage("");
      toast.success("Mensagem enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  return (
    <PageShell
      accent="violet"
      eyebrow="Ajuda"
      title="Suporte e Ajuda"
      subtitle="FAQ e chat com nossa equipe de atendimento."
      actions={
        <Button variant="outline" onClick={() => navigate("/configuracoes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      }
    >
      <>
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="faq">
              <HelpCircle className="h-4 w-4 mr-2" />
              Dúvidas Frequentes
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Fale Conosco
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Perguntas Frequentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Não encontrou o que procura? Entre em contato conosco pela
                    aba "Fale Conosco" e teremos prazer em ajudá-lo!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Chat de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                {showNewConversation ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto da sua dúvida</Label>
                      <Input
                        id="subject"
                        placeholder="Ex: Dúvida sobre vendas"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleStartConversation} className="w-full">
                      Iniciar Conversa
                    </Button>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Digite o assunto da sua dúvida e inicie uma conversa com nossa equipe de suporte.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Chat Messages */}
                    <ScrollArea className="h-96 border rounded-lg p-4 bg-muted/20">
                      <div className="space-y-3">
                        {messages.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8">
                            Nenhuma mensagem ainda. Envie a primeira mensagem!
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${
                                !msg.is_staff ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                  !msg.is_staff
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {formatDistanceToNow(new Date(msg.created_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="space-y-2">
                      <Label htmlFor="message">Digite sua mensagem</Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="message"
                          placeholder="Como podemos ajudar você?"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1 min-h-[60px]"
                        />
                        <Button
                          onClick={handleSendMessage}
                          className="self-end"
                          disabled={!message.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pressione Enter para enviar, Shift+Enter para quebrar linha
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewConversation(true);
                        setConversationId(null);
                      }}
                      className="w-full"
                    >
                      Iniciar Nova Conversa
                    </Button>
                  </div>
                )}

                {/* Contact Info */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Outros canais de contato</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>📧 Email: suporte@gestum.com</p>
                    <p>📱 WhatsApp: (71) 99738-3026</p>
                    <p>🕐 Horário de atendimento: Segunda a Sexta, 9h às 18h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </>
    </PageShell>
  );
}
