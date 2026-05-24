import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 bg-background">
      <header className="border-b border-border/40 px-6 py-4">
        <nav
          aria-label="Legal"
          className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-4 text-sm"
        >
          <Link href="/" className="font-semibold">
            MiNegocio
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href="/legal/privacidad" className="text-muted-foreground hover:text-foreground">
            Aviso de Privacidad
          </Link>
          <Link href="/legal/terminos" className="text-muted-foreground hover:text-foreground">
            Términos
          </Link>
          <Link href="/legal/subprocesadores" className="text-muted-foreground hover:text-foreground">
            Subprocesadores
          </Link>
          <Link href="/legal/derechos-arco" className="text-muted-foreground hover:text-foreground">
            Derechos ARCO
          </Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 md:px-10">
        <article className="prose prose-invert prose-sm max-w-none [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:my-3 [&_p]:leading-7 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1">
          {children}
        </article>
      </main>
    </div>
  );
}
