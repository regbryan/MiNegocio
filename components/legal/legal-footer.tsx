import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="border-t border-border/40 px-6 py-4 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} MiNegocio Digital</span>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-4">
          <Link href="/legal/privacidad" className="hover:text-foreground">
            Aviso de Privacidad
          </Link>
          <Link href="/legal/terminos" className="hover:text-foreground">
            Términos
          </Link>
          <Link href="/legal/subprocesadores" className="hover:text-foreground">
            Subprocesadores
          </Link>
          <Link href="/legal/derechos-arco" className="hover:text-foreground">
            Derechos ARCO
          </Link>
        </nav>
      </div>
    </footer>
  );
}
