/**
 * Quiet credit line above the global LegalFooter. Per PRODUCT.md: "the only
 * explicit acknowledgment that this is a portfolio piece. Quiet, not boastful."
 *
 * Server component. Static content.
 */
export function LandingFooterCredit() {
  return (
    <section
      aria-label="Crédito del proyecto"
      className="border-t border-white/[0.06] bg-[#0a0a0a]"
    >
      <div className="mx-auto max-w-[1800px] px-6 py-14 md:px-10 md:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="font-mono text-[12px] tracking-[0.02em] text-white/40">
            Construido por{" "}
            <span className="text-white/70">Reggie Bryant</span>. Código en{" "}
            <a
              href="https://github.com/regbryan/MiNegocio"
              target="_blank"
              rel="noreferrer"
              className="text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-[#48a890]"
            >
              github.com/regbryan/MiNegocio
            </a>
            .
          </p>
          <p className="font-mono text-[11px] tracking-[0.02em] text-white/30">
            agente · sonnet 4.6 · whatsapp via twilio sandbox
          </p>
        </div>
      </div>
    </section>
  );
}
