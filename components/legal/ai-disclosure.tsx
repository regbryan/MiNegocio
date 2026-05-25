import Link from "next/link";

/**
 * One-line AI + data-handling notice. Required by Mexican LFPDPPP +
 * good practice generally. Compact so it doesn't dominate the chat
 * surface it sits above.
 */
export function AiDisclosure({ tenantName }: { tenantName?: string }) {
  return (
    <p className="px-1 text-[11.5px] leading-[1.55] text-muted-foreground">
      Estás conversando con un asistente de IA
      {tenantName ? <> de <span className="text-foreground/80">{tenantName}</span></> : null}
      . Tus mensajes pueden contener datos personales que procesamos para
      agendar y atender tu solicitud — ver{" "}
      <Link
        href="/legal/privacidad"
        className="underline decoration-foreground/30 underline-offset-2 transition-colors hover:text-foreground"
      >
        Aviso de Privacidad
      </Link>{" "}
      y{" "}
      <Link
        href="/legal/derechos-arco"
        className="underline decoration-foreground/30 underline-offset-2 transition-colors hover:text-foreground"
      >
        derechos ARCO
      </Link>
      .
    </p>
  );
}
