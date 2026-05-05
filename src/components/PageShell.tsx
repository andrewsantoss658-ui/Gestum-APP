/**
 * @file PageShell.tsx
 * @description Wrapper visual reutilizável que aplica os layouts dinâmicos
 * (fundo aurora, header com gradiente, animação de entrada) em todas as
 * páginas internas do GESTUM, dando identidade fintech moderna sem precisar
 * editar cada página.
 */
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "blue" | "green" | "amber" | "violet" | "rose";

interface PageShellProps {
  children: ReactNode;
  /** Cor temática do "blob" decorativo do fundo */
  accent?: Accent;
  /** Texto pequeno acima do título (ex: "FINANCEIRO") */
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Botão / ação à direita do header */
  actions?: ReactNode;
  className?: string;
  /** Esconde o cartão de header (página já tem o seu) */
  hideHeader?: boolean;
}

const accentClass: Record<Accent, string> = {
  blue: "page-bg-mesh-blue",
  green: "page-bg-mesh-green",
  amber: "page-bg-mesh-amber",
  violet: "page-bg-mesh-violet",
  rose: "page-bg-mesh-rose",
};

export default function PageShell({
  children,
  accent = "blue",
  eyebrow,
  title,
  subtitle,
  actions,
  className,
  hideHeader,
}: PageShellProps) {
  return (
    <div className={cn("page-shell page-bg-aurora", accentClass[accent])}>
      <div className={cn("container max-w-7xl py-6 md:py-8", className)}>
        {!hideHeader && (title || eyebrow || subtitle || actions) && (
          <header className="page-header animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
                {title && <h1 className="page-header-title">{title}</h1>}
                {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
          </header>
        )}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
