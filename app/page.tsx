import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans">
      <main className="flex flex-col items-center gap-6 text-center px-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          MiNegocio Digital
        </h1>
        <p className="max-w-md text-lg leading-7 text-muted-foreground">
          Asistente de reservas con inteligencia artificial para tu negocio.
          Atiende a tus clientes 24/7 de forma automática.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/onboard">
            <Button size="lg" className="w-full">
              Registrar Mi Negocio
            </Button>
          </Link>
          <Link href="/chat/salon-maria">
            <Button size="lg" variant="outline" className="w-full">Probar Demo — Salon Maria</Button>
          </Link>
          <Link href="/widget">
            <Button size="lg" variant="ghost" className="w-full text-muted-foreground">
              Ver Widget Demo
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
