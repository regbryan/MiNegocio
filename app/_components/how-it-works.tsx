import { cn } from "@/lib/utils";

/**
 * Section 2 — "Así funciona."
 *
 * Three steps as an editorial sequence. Large display numerals on the left,
 * prose on the right. No icons, no card grid, no centered headings.
 */
export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-title"
      className="relative border-t border-white/[0.06] bg-[#0a0a0a]"
    >
      <div className="mx-auto max-w-[1800px] px-6 py-24 md:px-10 md:py-32 lg:py-36">
        <div
          className={cn(
            "grid grid-cols-1 gap-14",
            "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:gap-24",
          )}
        >
          {/* Section intro */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#48a890]">
              Cómo funciona
            </div>
            <h2
              id="how-title"
              className={cn(
                "mt-5 max-w-[14ch]",
                "text-[36px] leading-[1.05] font-semibold tracking-[-0.03em] text-white",
                "md:text-[44px]",
                "lg:text-[46px]",
              )}
            >
              No hay nada que instalar.
            </h2>
            <p
              className={cn(
                "mt-6 max-w-[36ch]",
                "text-[15px] leading-[1.65] text-white/55",
                "md:text-[16px]",
              )}
            >
              El asistente se conecta al mismo WhatsApp que ya usas. Tus
              clientes te escriben como siempre. La diferencia es que ahora
              hay alguien atendiendo a cualquier hora.
            </p>
          </div>

          {/* The three steps */}
          <ol className="flex flex-col gap-12 md:gap-16">
            <Step
              n={1}
              title="Tu cliente escribe por WhatsApp."
              body="Sin enlace nuevo, sin descargar nada, sin instalar una app. Le manda mensaje al mismo número de tu negocio, en su idioma, a la hora que quiera."
            />
            <Step
              n={2}
              title="El asistente entiende, agenda, contesta."
              body={
                <>
                  Es el mismo agente que estás viendo arriba. Pregunta lo
                  necesario, valida disponibilidad real contra tu calendario,
                  y deja la cita confirmada antes de cerrar la conversación.
                </>
              }
            />
            <Step
              n={3}
              title="Confirmación por correo, con calendario."
              body={
                <>
                  Tu cliente recibe la cita en su bandeja con un archivo{" "}
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12.5px] text-white/75">
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
        "grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-6 gap-y-3",
        "md:gap-x-8 lg:gap-x-10",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "font-mono text-[44px] leading-none tracking-[-0.04em] text-white/15",
          "md:text-[56px]",
          "lg:text-[64px]",
          "tabular-nums",
        )}
      >
        {String(n).padStart(2, "0")}
      </div>
      <div className="min-w-0">
        <h3
          className={cn(
            "text-[22px] leading-[1.25] font-medium tracking-[-0.015em] text-white",
            "md:text-[26px]",
            "lg:text-[28px]",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "col-start-2 mt-4 max-w-[58ch]",
            "text-[15px] leading-[1.7] text-white/60",
            "md:text-[16px]",
          )}
        >
          {body}
        </p>
      </div>
    </li>
  );
}
