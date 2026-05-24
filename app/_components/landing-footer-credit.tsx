/**
 * Quiet credit line above the global LegalFooter. Warm-lane version: lives on
 * the deeper sand panel so it reads as the natural close of the editorial
 * spread, not as a separate footer band.
 */
export function LandingFooterCredit() {
  return (
    <section
      aria-label="Crédito del proyecto"
      className="bg-[#ead8b6] text-[#6b594a]"
    >
      <div className="mx-auto max-w-[1800px] px-6 pb-16 md:px-10 md:pb-20">
        <div className="border-t border-[#c4ad84] pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
            <p className="font-spectral italic text-[15px] text-[#6b594a]">
              Construido por{" "}
              <span className="text-[#2a1f15] not-italic font-medium">
                Reggie Bryant
              </span>
              . Código en{" "}
              <a
                href="https://github.com/regbryan/MiNegocio"
                target="_blank"
                rel="noreferrer"
                className="text-[#2a1f15] underline decoration-[#c66c4a]/40 decoration-2 underline-offset-[5px] transition-colors hover:decoration-[#a8552f] hover:text-[#a8552f]"
              >
                github.com/regbryan/MiNegocio
              </a>
              .
            </p>
            <p className="font-mono text-[11px] tracking-[0.04em] text-[#a8552f]/70">
              agente · sonnet 4.6 · whatsapp via twilio sandbox
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
