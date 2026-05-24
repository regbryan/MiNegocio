import { cn } from "@/lib/utils";

/**
 * Section 2 — Así funciona.
 *
 * Three numbered steps in a vertical timeline. Prose, no icon grid (PRODUCT.md
 * anti-pattern: "generic three-column feature grid with icons").
 *
 * Server component — static content. No motion needed; this section is the
 * quiet middle of the page, not the headline.
 */
export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-title"
      className="border-t border-white/[0.06] bg-[#0a0a0a]"
    >
      <div className="mx-auto max-w-[1800px] px-6 py-24 md:px-10 md:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-20">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#48a890]">
              Cómo funciona
            </div>
            <h2
              id="how-title"
              className="mt-4 max-w-[14ch] text-[36px] leading-[1.05] font-semibold tracking-[-0.03em] text-white md:text-[44px]"
            >
              Sin curva de aprendizaje, sin instalar nada.
            </h2>
            <p className="mt-6 max-w-[40ch] text-[16px] leading-[1.6] text-white/55">
              El asistente se conecta al WhatsApp que ya usas. Tus clientes te
              escriben como siempre — la diferencia es que ahora hay alguien
              disponible 24/7 para agendar, confirmar y recordar.
            </p>
          </div>

          <ol className="relative space-y-12 lg:mt-2">
            {/* Vertical timeline rule */}
            <div
              aria-hidden="true"
              className="absolute left-[14px] top-2 bottom-2 w-px bg-gradient-to-b from-white/12 via-white/8 to-transparent"
            />
            <Step
              number={1}
              title="Tu cliente te escribe por WhatsApp."
              body="Sin enlace nuevo, sin descargar nada. Le manda mensaje al mismo número de tu negocio, igual que siempre."
            />
            <Step
              number={2}
              title="El asistente entiende, agenda, contesta."
              body={
                <>
                  Es el mismo agente que estás viendo arriba. Pregunta lo
                  necesario, valida disponibilidad real, y agenda la cita en
                  tu calendario.
                </>
              }
            />
            <Step
              number={3}
              title="Confirmación por correo y calendario."
              body={
                <>
                  Tu cliente recibe la cita en su bandeja con un archivo{" "}
                  <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px] text-white/70">
                    .ics
                  </code>{" "}
                  para Google, Apple o Outlook. Tú recibes copia. Cero esfuerzo.
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
  number,
  title,
  body,
}: {
  number: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="relative pl-12">
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0 inline-flex h-7 w-7 items-center justify-center",
          "rounded-full border border-white/12 bg-[#0a0a0a]",
          "font-mono text-[12px] font-medium tracking-[0.02em] text-[#48a890]",
        )}
      >
        {number}
      </span>
      <h3 className="text-[20px] leading-[1.3] font-medium tracking-[-0.01em] text-white md:text-[22px]">
        {title}
      </h3>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.65] text-white/55 md:text-[16px]">
        {body}
      </p>
    </li>
  );
}
