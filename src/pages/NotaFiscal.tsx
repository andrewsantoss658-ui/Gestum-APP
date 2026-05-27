import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatCpfCnpj, validateCpfCnpj } from "@/lib/validators";
import { buscarEnderecoPorCep, formatCep } from "@/lib/cep";
import { ArrowLeft, FileText, Plus, Trash2, Download, X, MapPin, Building2, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";

interface NotaItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface NotaFiscalData {
  id: string;
  numero: string;
  cliente: string;
  cpf_cnpj: string;
  total: number;
  emitida_em: string;
  status: string;
}

interface EmissorData {
  nome: string;
  cpfCnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
}

interface DestinatarioData {
  nome: string;
  cpfCnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
}

const NotaFiscal = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [notas, setNotas] = useState<NotaFiscalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [buscandoCepEmissor, setBuscandoCepEmissor] = useState(false);
  const [buscandoCepDestinatario, setBuscandoCepDestinatario] = useState(false);
  
  // Emissor (dados do usuário/empresa)
  const [emissor, setEmissor] = useState<EmissorData>({
    nome: "",
    cpfCnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    email: "",
  });

  // Destinatário (cliente)
  const [destinatario, setDestinatario] = useState<DestinatarioData>({
    nome: "",
    cpfCnpj: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    email: "",
  });

  // Items da nota
  const [items, setItems] = useState<NotaItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Informações adicionais
  const [observacoes, setObservacoes] = useState("");
  const [naturezaOperacao, setNaturezaOperacao] = useState("Venda de Mercadoria");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Carregar perfil do emissor
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setEmissor(prev => ({
          ...prev,
          nome: profile.nome || "",
          cpfCnpj: profile.cpf_cnpj || "",
        }));
      }

      // Carregar produtos
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id);

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Carregar notas fiscais
      const { data: notasData, error: notasError } = await supabase
        .from("notas_fiscais")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (notasError) throw notasError;
      setNotas(notasData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleEmissorCpfCnpjChange = (value: string) => {
    const formatted = formatCpfCnpj(value);
    setEmissor(prev => ({ ...prev, cpfCnpj: formatted }));
  };

  const handleDestinatarioCpfCnpjChange = (value: string) => {
    const formatted = formatCpfCnpj(value);
    setDestinatario(prev => ({ ...prev, cpfCnpj: formatted }));
  };

  const handleEmissorCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setEmissor(prev => ({ ...prev, cep: formatted }));

    if (formatted.replace(/\D/g, "").length === 8) {
      setBuscandoCepEmissor(true);
      const endereco = await buscarEnderecoPorCep(formatted);
      setBuscandoCepEmissor(false);

      if (endereco) {
        setEmissor(prev => ({
          ...prev,
          endereco: endereco.rua,
          cidade: endereco.cidade,
          estado: endereco.estado,
        }));
        toast.success("Endereço do emissor preenchido automaticamente!");
      } else {
        toast.error("CEP não encontrado");
      }
    }
  };

  const handleDestinatarioCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setDestinatario(prev => ({ ...prev, cep: formatted }));

    if (formatted.replace(/\D/g, "").length === 8) {
      setBuscandoCepDestinatario(true);
      const endereco = await buscarEnderecoPorCep(formatted);
      setBuscandoCepDestinatario(false);

      if (endereco) {
        setDestinatario(prev => ({
          ...prev,
          endereco: endereco.rua,
          cidade: endereco.cidade,
          estado: endereco.estado,
        }));
        toast.success("Endereço do destinatário preenchido automaticamente!");
      } else {
        toast.error("CEP não encontrado");
      }
    }
  };

  const addItem = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    if (quantity > product.quantity) {
      toast.error("Quantidade indisponível em estoque");
      return;
    }

    const newItem: NotaItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      total: product.price * quantity,
    };

    setItems([...items, newItem]);
    setSelectedProduct("");
    setQuantity(1);
    toast.success("Item adicionado");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const generateQRCodeData = (nota: any) => {
    // Dados para validação da nota fiscal
    const qrData = {
      numero: nota.numero,
      emissao: nota.emitidaEm,
      emissor: emissor.cpfCnpj,
      destinatario: destinatario.cpfCnpj,
      total: nota.total,
      chave: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase(),
    };
    return JSON.stringify(qrData);
  };

  const handleEmitir = async () => {
    // Validações do emissor
    if (!emissor.nome.trim()) {
      toast.error("Informe o nome do emissor");
      return;
    }
    if (!validateCpfCnpj(emissor.cpfCnpj)) {
      toast.error("CPF/CNPJ do emissor inválido");
      return;
    }

    // Validações do destinatário
    if (!destinatario.nome.trim()) {
      toast.error("Informe o nome do destinatário");
      return;
    }
    if (!validateCpfCnpj(destinatario.cpfCnpj)) {
      toast.error("CPF/CNPJ do destinatário inválido");
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const emitidaEm = new Date().toISOString();
      const numero = `NF-${Date.now().toString().slice(-8)}`;

      // Salvar nota fiscal
      const { data: notaData, error: notaError } = await supabase
        .from("notas_fiscais")
        .insert({
          user_id: user.id,
          numero,
          cliente: destinatario.nome,
          cpf_cnpj: destinatario.cpfCnpj,
          total: calculateTotal(),
          status: "emitida",
        })
        .select()
        .single();

      if (notaError || !notaData) {
        throw notaError ?? new Error("Não foi possível salvar a nota fiscal");
      }

      // Salvar itens da nota
      const notaItems = items.map(item => ({
        nota_fiscal_id: notaData.id,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("nota_fiscal_items")
        .insert(notaItems);

      if (itemsError) throw itemsError;

      // Atualizar estoque
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ quantity: product.quantity - item.quantity })
            .eq("id", item.productId);

          if (updateError) throw updateError;
        }
      }

      const notaCompleta = {
        ...notaData,
        emitidaEm,
        items,
        emissor,
        destinatario,
        naturezaOperacao,
        observacoes,
      };

      await generateNotaPDF(notaCompleta);
      
      // Reset form
      setDestinatario({
        nome: "",
        cpfCnpj: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        telefone: "",
        email: "",
      });
      setItems([]);
      setObservacoes("");
      loadData();
      
      toast.success("Nota fiscal emitida com sucesso!");
    } catch (error) {
      console.error("Erro ao emitir nota fiscal:", error);
      toast.error("Erro ao emitir nota fiscal");
    }
  };

  const generateNotaPDF = async (nota: any) => {
    const doc = new jsPDF();
    const dataEmissao = new Date(nota.emitidaEm || nota.emitida_em);
    
    // Gerar QR Code
    const qrCodeData = generateQRCodeData(nota);
    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, { width: 80, margin: 1 });
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
    }

    // ========== CABEÇALHO ==========
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 35, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("NOTA FISCAL", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Documento Auxiliar da Nota Fiscal Eletrônica", 105, 23, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Nº ${nota.numero}`, 105, 31, { align: "center" });

    // QR Code no canto superior direito
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, "PNG", 165, 40, 35, 35);
    }

    // ========== INFORMAÇÕES DA EMISSÃO ==========
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 40, 150, 35, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DA EMISSÃO", 15, 47);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const diaSemana = diasSemana[dataEmissao.getDay()];
    
    doc.text(`Data: ${dataEmissao.toLocaleDateString("pt-BR")}`, 15, 54);
    doc.text(`Hora: ${dataEmissao.toLocaleTimeString("pt-BR")}`, 75, 54);
    doc.text(`Dia: ${diaSemana}`, 120, 54);
    doc.text(`Natureza da Operação: ${nota.naturezaOperacao || naturezaOperacao}`, 15, 61);
    
    // Chave de acesso
    const chaveAcesso = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase().slice(0, 44);
    doc.text(`Chave de Acesso: ${chaveAcesso}`, 15, 68);

    // ========== EMISSOR ==========
    doc.setFillColor(230, 245, 255);
    doc.rect(10, 80, 190, 35, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("EMITENTE", 15, 87);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    const emissorData = nota.emissor || emissor;
    doc.text(`Nome/Razão Social: ${emissorData.nome}`, 15, 94);
    doc.text(`CPF/CNPJ: ${emissorData.cpfCnpj}`, 120, 94);
    doc.text(`Endereço: ${emissorData.endereco || "Não informado"}`, 15, 101);
    doc.text(`Cidade: ${emissorData.cidade || "Não informado"}`, 15, 108);
    doc.text(`UF: ${emissorData.estado || "-"}`, 80, 108);
    doc.text(`CEP: ${emissorData.cep || "-"}`, 100, 108);
    doc.text(`Tel: ${emissorData.telefone || "-"}`, 140, 108);

    // ========== DESTINATÁRIO ==========
    doc.setFillColor(255, 245, 230);
    doc.rect(10, 120, 190, 35, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DESTINATÁRIO", 15, 127);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    const destinatarioData = nota.destinatario || destinatario;
    doc.text(`Nome/Razão Social: ${destinatarioData.nome || nota.cliente}`, 15, 134);
    doc.text(`CPF/CNPJ: ${destinatarioData.cpfCnpj || nota.cpf_cnpj}`, 120, 134);
    doc.text(`Endereço: ${destinatarioData.endereco || "Não informado"}`, 15, 141);
    doc.text(`Cidade: ${destinatarioData.cidade || "Não informado"}`, 15, 148);
    doc.text(`UF: ${destinatarioData.estado || "-"}`, 80, 148);
    doc.text(`CEP: ${destinatarioData.cep || "-"}`, 100, 148);
    doc.text(`Tel: ${destinatarioData.telefone || "-"}`, 140, 148);

    // ========== PRODUTOS ==========
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("PRODUTOS / SERVIÇOS", 15, 163);

    const notaItems = nota.items || [];
    const tableData = notaItems.map((item: NotaItem, index: number) => [
      (index + 1).toString(),
      item.productName,
      item.quantity.toString(),
      "UN",
      `R$ ${item.price.toFixed(2)}`,
      `R$ ${item.total.toFixed(2)}`,
    ]);

    (doc as any).autoTable({
      startY: 167,
      head: [["#", "Descrição do Produto/Serviço", "Qtd", "Un", "Valor Unit.", "Valor Total"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 80 },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 30, halign: "right" },
        5: { cellWidth: 30, halign: "right" },
      },
    });

    // ========== TOTAIS ==========
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    
    doc.setFillColor(41, 128, 185);
    doc.rect(120, finalY, 80, 15, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("VALOR TOTAL:", 125, finalY + 7);
    doc.setFontSize(14);
    doc.text(`R$ ${nota.total.toFixed(2)}`, 195, finalY + 10, { align: "right" });

    // ========== OBSERVAÇÕES ==========
    if (nota.observacoes) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMAÇÕES COMPLEMENTARES:", 15, finalY + 25);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(nota.observacoes, 15, finalY + 32, { maxWidth: 180 });
    }

    // ========== RODAPÉ ==========
    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(41, 128, 185);
    doc.rect(0, pageHeight - 20, 210, 20, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("Documento gerado eletronicamente - Valide através do QR Code", 105, pageHeight - 12, { align: "center" });
    doc.text(`Emitido em: ${dataEmissao.toLocaleDateString("pt-BR")} às ${dataEmissao.toLocaleTimeString("pt-BR")}`, 105, pageHeight - 6, { align: "center" });

    doc.save(`nota-fiscal-${nota.numero}.pdf`);
  };

  const handleCancelar = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notas_fiscais")
        .update({ status: "cancelada" })
        .eq("id", id);

      if (error) throw error;
      
      loadData();
      toast.success("Nota fiscal cancelada");
    } catch (error) {
      console.error("Erro ao cancelar nota:", error);
      toast.error("Erro ao cancelar nota fiscal");
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
    <PageShell
      accent="rose"
      eyebrow="Fiscal"
      title="Nota Fiscal"
      subtitle="Emita e consulte notas fiscais com dados validados."
      actions={
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Form de emissão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Emitir Nova Nota Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dados do Emissor */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Dados do Emissor</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emissorNome">Nome/Razão Social *</Label>
                  <Input
                    id="emissorNome"
                    value={emissor.nome}
                    onChange={(e) => setEmissor(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo ou razão social"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emissorCpfCnpj">CPF/CNPJ *</Label>
                  <Input
                    id="emissorCpfCnpj"
                    value={emissor.cpfCnpj}
                    onChange={(e) => handleEmissorCpfCnpjChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={18}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emissorEndereco">Endereço</Label>
                  <Input
                    id="emissorEndereco"
                    value={emissor.endereco}
                    onChange={(e) => setEmissor(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emissorCep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="emissorCep"
                      value={emissor.cep}
                      onChange={(e) => handleEmissorCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {buscandoCepEmissor && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="emissorCidade">Cidade</Label>
                  <Input
                    id="emissorCidade"
                    value={emissor.cidade}
                    onChange={(e) => setEmissor(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emissorEstado">UF</Label>
                  <Input
                    id="emissorEstado"
                    value={emissor.estado}
                    onChange={(e) => setEmissor(prev => ({ ...prev, estado: e.target.value }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emissorTelefone">Telefone</Label>
                  <Input
                    id="emissorTelefone"
                    value={emissor.telefone}
                    onChange={(e) => setEmissor(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emissorEmail">E-mail</Label>
                  <Input
                    id="emissorEmail"
                    type="email"
                    value={emissor.email}
                    onChange={(e) => setEmissor(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Dados do Destinatário */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <User className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Dados do Destinatário</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="destinatarioNome">Nome/Razão Social *</Label>
                  <Input
                    id="destinatarioNome"
                    value={destinatario.nome}
                    onChange={(e) => setDestinatario(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo ou razão social"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinatarioCpfCnpj">CPF/CNPJ *</Label>
                  <Input
                    id="destinatarioCpfCnpj"
                    value={destinatario.cpfCnpj}
                    onChange={(e) => handleDestinatarioCpfCnpjChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={18}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="destinatarioEndereco">Endereço</Label>
                  <Input
                    id="destinatarioEndereco"
                    value={destinatario.endereco}
                    onChange={(e) => setDestinatario(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinatarioCep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="destinatarioCep"
                      value={destinatario.cep}
                      onChange={(e) => handleDestinatarioCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {buscandoCepDestinatario && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="destinatarioCidade">Cidade</Label>
                  <Input
                    id="destinatarioCidade"
                    value={destinatario.cidade}
                    onChange={(e) => setDestinatario(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinatarioEstado">UF</Label>
                  <Input
                    id="destinatarioEstado"
                    value={destinatario.estado}
                    onChange={(e) => setDestinatario(prev => ({ ...prev, estado: e.target.value }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinatarioTelefone">Telefone</Label>
                  <Input
                    id="destinatarioTelefone"
                    value={destinatario.telefone}
                    onChange={(e) => setDestinatario(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinatarioEmail">E-mail</Label>
                  <Input
                    id="destinatarioEmail"
                    type="email"
                    value={destinatario.email}
                    onChange={(e) => setDestinatario(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Natureza da Operação */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="naturezaOperacao">Natureza da Operação</Label>
                <Select value={naturezaOperacao} onValueChange={setNaturezaOperacao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Venda de Mercadoria">Venda de Mercadoria</SelectItem>
                    <SelectItem value="Prestação de Serviço">Prestação de Serviço</SelectItem>
                    <SelectItem value="Devolução de Mercadoria">Devolução de Mercadoria</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Remessa para Conserto">Remessa para Conserto</SelectItem>
                    <SelectItem value="Venda para Entrega Futura">Venda para Entrega Futura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t" />

            {/* Produtos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Produtos / Serviços</h3>
              </div>
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-[200px] space-y-2">
                  <Label>Produto</Label>
                  <Select value={selectedProduct || undefined} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.price.toFixed(2)} (Estoque: {product.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label>Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <Button onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">R$ {item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={4} className="text-right font-bold">TOTAL:</TableCell>
                      <TableCell className="text-right font-bold text-lg text-primary">
                        R$ {calculateTotal().toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleEmitir} size="lg" className="gap-2">
                <FileText className="w-5 h-5" />
                Emitir Nota Fiscal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de notas emitidas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas Fiscais Emitidas</CardTitle>
          </CardHeader>
          <CardContent>
            {notas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma nota fiscal emitida ainda
              </p>
            ) : (
              <div className="space-y-3">
                {notas.map((nota) => (
                  <div
                    key={nota.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{nota.numero}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          nota.status === "emitida" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100" 
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                        }`}>
                          {nota.status === "emitida" ? "Emitida" : "Cancelada"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {nota.cliente} - {nota.cpf_cnpj}
                      </p>
                      <p className="text-sm">
                        {new Date(nota.emitida_em).toLocaleDateString("pt-BR")} às {new Date(nota.emitida_em).toLocaleTimeString("pt-BR")} - R$ {nota.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateNotaPDF({
                          ...nota,
                          emitidaEm: nota.emitida_em,
                          items: [],
                          emissor,
                          destinatario: { nome: nota.cliente, cpfCnpj: nota.cpf_cnpj },
                        })}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      {nota.status === "emitida" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelar(nota.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NotaFiscal;
