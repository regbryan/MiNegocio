import type { Metadata } from "next";
import { LandingHero } from "./_components/landing-hero";
import { HowItWorksSection } from "./_components/how-it-works";
import { LiveTranscriptSection } from "./_components/live-transcript";
import { LandingFooterCredit } from "./_components/landing-footer-credit";
import {
  getConfirmedBookingsCount,
  getRecentAnonymizedBookings,
} from "@/lib/db/landing-queries";

// Revalidate the page every 60 seconds so the bookings count + live transcript
// stay fresh without pounding Supabase on every request.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tu asistente en WhatsApp · MiNegocio",
  description:
    "Atiende a tus clientes, agenda citas y manda confirmaciones por correo — todo en piloto automático, dentro de WhatsApp.",
  openGraph: {
    title: "Tu asistente en WhatsApp · MiNegocio",
    description:
      "Atiende a tus clientes, agenda citas y manda confirmaciones por correo — todo en piloto automático.",
  },
};

export default async function HomePage() {
  // Best-effort data fetch — both helpers swallow errors and return safe
  // fallbacks so the landing page never fails to render.
  const [bookingsCount, recentBookings] = await Promise.all([
    getConfirmedBookingsCount(),
    getRecentAnonymizedBookings(4),
  ]);

  return (
    <main id="main" className="flex-1 bg-[#0a0a0a] text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Saltar al contenido
      </a>
      <LandingHero bookingsCount={bookingsCount} />
      <HowItWorksSection />
      <LiveTranscriptSection bookings={recentBookings} />
      <LandingFooterCredit />
    </main>
  );
}
