import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Save, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function MinhaConta() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCpfCnpj, setUserCpfCnpj] = useState("");
  const [userId, setUserId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const displayName = userName?.trim() || "Usuário";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "" },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const user = session.user;
      const nome = user.user_metadata?.nome || "";
      const email = user.email || "";
      const cpfCnpj = user.user_metadata?.cpf_cnpj || "";

      setUserId(user.id);
      setUserName(nome);
      setUserEmail(email);
      setUserCpfCnpj(cpfCnpj);
      profileForm.reset({ name: nome, email });

      // Load avatar from localStorage
      const savedAvatar = localStorage.getItem(`gestum_avatar_${user.id}`);
      if (savedAvatar) setAvatarUrl(savedAvatar);

      setLoading(false);
    };
    loadUser();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        if (userId) {
          localStorage.setItem(`gestum_avatar_${userId}`, result);
          toast({ title: "Foto atualizada", description: "Sua foto de perfil foi atualizada com sucesso." });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      // Update Supabase auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        email: data.email,
        data: { nome: data.name },
      });
      if (authError) throw authError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ nome: data.name, email: data.email })
        .eq("id", userId);
      if (profileError) throw profileError;

      setUserName(data.name);
      setUserEmail(data.email);
      toast({ title: "Perfil atualizado", description: "Seus dados foram atualizados com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível atualizar o perfil.", variant: "destructive" });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword });
      if (error) throw error;
      passwordForm.reset();
      toast({ title: "Senha atualizada", description: "Sua senha foi alterada com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível alterar a senha.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-lg border bg-card p-6">
          <h1 className="text-xl font-semibold">Sessão não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não foi possível carregar seus dados. Faça login novamente.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate("/login", { replace: true })}>Ir para Login</Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Ir para Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/configuracoes")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Configurações
        </Button>
        <h1 className="text-4xl font-bold mb-8">Minha Conta</h1>

        <Card className="mb-6">
          <CardHeader><CardTitle>Foto de Perfil</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-2xl">{displayInitial}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <span>Alterar Foto</span>
                </div>
              </Label>
              <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <p className="text-sm text-muted-foreground mt-2">JPG, PNG ou GIF (máx. 5MB)</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="password">Alterar Senha</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" {...profileForm.register("name")} placeholder="Seu nome completo" />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...profileForm.register("email")} placeholder="seu@email.com" />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>CPF/CNPJ</Label>
                    <Input value={userCpfCnpj} disabled className="bg-muted" />
                    <p className="text-sm text-muted-foreground">CPF/CNPJ não pode ser alterado</p>
                  </div>
                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader><CardTitle>Alterar Senha</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} placeholder="Digite a nova senha" />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} placeholder="Confirme a nova senha" />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
