import { cn } from "@/lib/utils";

/**
 * Section 2 — Así funciona.
 *
 * Editorial sequence on warm canvas, paired with the new hospitality lane.
 * Three steps as a numbered serif sequence with hand-set composition. Not a
 * card grid, not an icon row, not a SaaS landing's "how it works."
 */
export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-title"
      className="relative bg-[#ead8b6] text-[#2a1f15]"
    >
      {/* Top deckle edge — a subtle wave between cream hero and deeper sand */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-px h-12 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(245,235,216,1),rgba(234,216,182,1))]"
      />

      <div className="mx-auto max-w-[1800px] px-6 py-24 md:px-10 md:py-32 lg:py-36">
        <div
          className={cn(
            "grid grid-cols-1 gap-14",
            "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:gap-24",
          )}
        >
          {/* Section intro */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#a8552f]">
              Cómo funciona
            </p>
            <h2
              id="how-title"
              className={cn(
                "font-spectral",
                "mt-5 max-w-[14ch]",
                "text-[36px] leading-[1.05] font-medium tracking-[-0.015em]",
                "md:text-[42px]",
                "lg:text-[46px]",
              )}
            >
              No hay nada que instalar.
            </h2>
            <p
              className={cn(
                "font-spectral",
                "mt-6 max-w-[38ch]",
                "text-[16px] leading-[1.6] italic text-[#6b594a]",
                "md:text-[17px]",
              )}
            >
              El asistente vive dentro del WhatsApp que ya usas. Tus clientes
              te escriben como siempre. Lo único distinto es que ahora siempre
              hay alguien atendiendo.
            </p>
          </div>

          {/* The three steps */}
          <ol className="flex flex-col gap-14 md:gap-20">
            <Step
              n={1}
              title="Tu cliente escribe."
              body="Sin enlace nuevo, sin descargar nada, sin instalar una app. Te manda mensaje al mismo número de tu negocio, en su idioma, a la hora que pueda."
            />
            <Step
              n={2}
              title="El asistente entiende, agenda, contesta."
              body={
                <>
                  Es el mismo agente que estás viendo arriba. Pregunta lo
                  necesario, valida disponibilidad contra tu calendario, y deja
                  la cita confirmada antes de cerrar la conversación.
                </>
              }
            />
            <Step
              n={3}
              title="Confirmación por correo, con calendario."
              body={
                <>
                  Tu cliente recibe la cita en su bandeja con un archivo{" "}
                  <code className="rounded bg-[#c66c4a]/10 px-1.5 py-0.5 font-mono text-[12.5px] text-[#a8552f]">
                    .ics
                  </code>{" "}
                  para Google, Apple o Outlook. Tú recibes copia. Cero
                  intervención manual.
                </>
              }
            />
          </ol>
        </div>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-7 gap-y-3",
        "md:gap-x-10 lg:gap-x-12",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "font-spectral tabular-nums",
          "text-[52px] leading-none font-medium text-[#c66c4a]/35",
          "md:text-[68px]",
          "lg:text-[80px]",
        )}
      >
        {String(n).padStart(2, "0")}
      </div>
      <div className="min-w-0">
        <h3
          className={cn(
            "font-spectral",
            "text-[24px] leading-[1.2] font-medium tracking-[-0.01em] text-[#2a1f15]",
            "md:text-[28px]",
            "lg:text-[32px]",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "font-spectral",
            "col-start-2 mt-4 max-w-[58ch]",
            "text-[16px] leading-[1.65] text-[#6b594a]",
            "md:text-[17px]",
          )}
        >
          {body}
        </p>
      </div>
    </li>
  );
}
