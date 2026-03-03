import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Package, ArrowLeft } from "lucide-react";
import { formatCpfCnpj, validateCpfCnpj } from "@/lib/validators";
import logoGestum from "@/assets/logo_gestum_new.png";

const RecuperarSenha = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "verify" | "reset">("email");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCpfCnpjChange = (value: string) => {
    const formatted = formatCpfCnpj(value);
    setCpfCnpj(formatted);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar se o CPF/CNPJ é válido
      if (!validateCpfCnpj(cpfCnpj)) {
        toast.error("CPF/CNPJ inválido");
        setLoading(false);
        return;
      }

      // Verificar se existe um perfil com esse email e CPF/CNPJ
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("cpf_cnpj")
        .eq("cpf_cnpj", cpfCnpj)
        .single();

      if (profileError || !profile) {
        toast.error("CPF/CNPJ não encontrado no sistema");
        setLoading(false);
        return;
      }

      // Enviar email de recuperação
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/recuperar-senha`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setStep("verify");
    } catch (error: any) {
      toast.error(error.message || "Erro ao solicitar recuperação de senha");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
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
            Voltar ao login
          </Button>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
            <CardDescription className="text-base mt-2">
              {step === "email" && "Informe seu email e CPF/CNPJ para recuperar sua senha"}
              {step === "verify" && "Verifique seu email e clique no link para redefinir a senha"}
              {step === "reset" && "Defina sua nova senha"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={handleRequestReset} className="space-y-4">
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
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={(e) => handleCpfCnpjChange(e.target.value)}
                  maxLength={18}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Enviando..." : "Enviar email de recuperação"}
              </Button>
            </form>
          )}

          {step === "verify" && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Enviamos um link de recuperação para <strong>{email}</strong>.
                Clique no link para redefinir sua senha.
              </p>
              <Button
                variant="outline"
                onClick={() => setStep("email")}
                className="w-full"
              >
                Reenviar email
              </Button>
            </div>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Alterando..." : "Alterar senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecuperarSenha;
