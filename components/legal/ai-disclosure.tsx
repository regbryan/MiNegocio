import Link from "next/link";

export function AiDisclosure({ tenantName }: { tenantName?: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
      Está conversando con un asistente de inteligencia artificial
      {tenantName ? <> operado por <strong>{tenantName}</strong></> : null} sobre
      la plataforma MiNegocio. Sus mensajes pueden incluir datos personales
      que se procesarán para agendar citas y atender su consulta. Consulte el{" "}
      <Link href="/legal/privacidad" className="underline">
        Aviso de Privacidad
      </Link>
      . Puede ejercer sus derechos ARCO en{" "}
      <Link href="/legal/derechos-arco" className="underline">
        /legal/derechos-arco
      </Link>
      .
    </div>
  );
}
