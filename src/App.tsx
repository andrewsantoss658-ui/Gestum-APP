import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import NovaVenda from "./pages/NovaVenda";
import Pix from "./pages/Pix";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import MinhaConta from "./pages/MinhaConta";
import Notificacoes from "./pages/Notificacoes";
import Suporte from "./pages/Suporte";
import Caderneta from "./pages/Caderneta";
import ContasPagar from "./pages/ContasPagar";
import FluxoCaixa from "./pages/FluxoCaixa";
import NotaFiscal from "./pages/NotaFiscal";
import RecuperarSenha from "./pages/RecuperarSenha";
import NotFound from "./pages/NotFound";
import EstoqueBaixoAlert from "./components/EstoqueBaixoAlert";
import AdminSuportePanel from "./pages/AdminSuportePanel";
import GestaoSuporte from "./pages/GestaoSuporte";
import SuporteEquipes from "./pages/admin/SuporteEquipes";
import SuporteRelatorios from "./pages/admin/SuporteRelatorios";
import SuporteConfiguracoes from "./pages/admin/SuporteConfiguracoes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <EstoqueBaixoAlert />
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/produtos" element={<ProtectedRoute><Layout><Produtos /></Layout></ProtectedRoute>} />
          <Route path="/estoque" element={<ProtectedRoute><Layout><Estoque /></Layout></ProtectedRoute>} />
          <Route path="/vendas/nova" element={<ProtectedRoute><Layout><NovaVenda /></Layout></ProtectedRoute>} />
          <Route path="/pix/novo" element={<ProtectedRoute><Layout><Pix /></Layout></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Layout><Relatorios /></Layout></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Layout><Configuracoes /></Layout></ProtectedRoute>} />
          <Route path="/minha-conta" element={<ProtectedRoute><Layout><MinhaConta /></Layout></ProtectedRoute>} />
          <Route path="/notificacoes" element={<ProtectedRoute><Layout><Notificacoes /></Layout></ProtectedRoute>} />
          <Route path="/suporte" element={<ProtectedRoute><Layout><Suporte /></Layout></ProtectedRoute>} />
          <Route path="/caderneta" element={<ProtectedRoute><Layout><Caderneta /></Layout></ProtectedRoute>} />
          <Route path="/contas-pagar" element={<ProtectedRoute><Layout><ContasPagar /></Layout></ProtectedRoute>} />
          <Route path="/fluxo-caixa" element={<ProtectedRoute><Layout><FluxoCaixa /></Layout></ProtectedRoute>} />
          <Route path="/nota-fiscal" element={<ProtectedRoute><Layout><NotaFiscal /></Layout></ProtectedRoute>} />
          <Route path="/admin/suporte" element={<ProtectedRoute><Layout><AdminSuportePanel /></Layout></ProtectedRoute>} />
          <Route path="/admin/gestao-suporte" element={<ProtectedRoute><Layout><GestaoSuporte /></Layout></ProtectedRoute>} />
          <Route path="/admin/equipes" element={<ProtectedRoute><Layout><SuporteEquipes /></Layout></ProtectedRoute>} />
          <Route path="/admin/relatorios-suporte" element={<ProtectedRoute><Layout><SuporteRelatorios /></Layout></ProtectedRoute>} />
          <Route path="/admin/config-chat" element={<ProtectedRoute><Layout><SuporteConfiguracoes /></Layout></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
