import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Package, ArrowLeft } from "lucide-react";
import { formatCpfCnpj, validateCpfCnpj } from "@/lib/validators";
import logoGestum from "@/assets/logo_gestum_new.png";

const Cadastro = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedLGPD, setAcceptedLGPD] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCpfCnpjChange = (value: string) => {
    const formatted = formatCpfCnpj(value);
    setCpfCnpj(formatted);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedLGPD) {
      toast.error("Você precisa aceitar os termos da LGPD");
      return;
    }

    if (!validateCpfCnpj(cpfCnpj)) {
      toast.error("CPF ou CNPJ inválido");
      return;
    }

    setLoading(true);

    try {
      // Verificar se CPF/CNPJ já existe
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("cpf_cnpj", cpfCnpj)
        .maybeSingle();

      if (checkError) {
        console.error("Erro ao verificar CPF/CNPJ:", checkError);
      }

      if (existingProfile) {
        toast.error("CPF/CNPJ já cadastrado no sistema");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            nome: name,
            cpf_cnpj: cpfCnpj,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Conta criada com sucesso!");
        navigate("/onboarding", { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url(${logoGestum})`,
          backgroundSize: '300px 120px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2"
            onClick={() => navigate("/login")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
            <CardDescription className="text-base mt-2">
              Comece a gerenciar seu negócio
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="cpfCnpj"
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={cpfCnpj}
                onChange={(e) => handleCpfCnpjChange(e.target.value)}
                maxLength={18}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="lgpd"
                checked={acceptedLGPD}
                onCheckedChange={(checked) => setAcceptedLGPD(checked as boolean)}
              />
              <label
                htmlFor="lgpd"
                className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Aceito o tratamento dos meus dados conforme a LGPD
              </label>
            </div>
            
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;
