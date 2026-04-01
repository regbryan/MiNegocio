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
        <Link href="/chat/salon-maria">
          <Button size="lg">Probar Demo — Salon Maria</Button>
        </Link>
      </main>
    </div>
  );
}
