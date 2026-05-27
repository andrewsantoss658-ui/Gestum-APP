import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { WifiOff, Package, Zap } from "lucide-react";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: WifiOff,
      title: "Registre vendas mesmo offline",
      description: "Não precisa de internet para registrar suas vendas. Sincronizamos automaticamente quando você se conectar.",
    },
    {
      icon: Package,
      title: "Controle de estoque automático",
      description: "Seu estoque é atualizado a cada venda. Receba alertas quando os produtos estiverem acabando.",
    },
    {
      icon: Zap,
      title: "Receba por Pix rapidamente",
      description: "Gere cobranças Pix instantâneas e compartilhe com seus clientes. Acompanhe pagamentos em tempo real.",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setOpen(false);
      setCurrentSlide(0);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        title="Guia Rápido"
        aria-label="Abrir guia rápido"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Guia Rápido</DialogTitle>
          </DialogHeader>

          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <CurrentIcon className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-foreground">
                {slides[currentSlide].title}
              </h3>
              <p className="text-muted-foreground">
                {slides[currentSlide].description}
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              {currentSlide > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  Anterior
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="flex-1"
              >
                {currentSlide < slides.length - 1 ? "Próximo" : "Concluir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
