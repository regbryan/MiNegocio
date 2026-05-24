import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import { Providers } from "./providers";
import { ConsentBanner } from "@/components/legal/consent-banner";
import { LegalFooter } from "@/components/legal/legal-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Spectral — warm hospitality serif, used on the landing page brand surface.
// Not in the AI-default ban list. Pairs well with body sans for editorial work.
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://minegocio.digital",
  ),
  title: {
    default: "MiNegocio Digital",
    template: "%s · MiNegocio",
  },
  description:
    "Asistente de reservas con IA para tu negocio. Atiende a tus clientes 24/7 de forma automática.",
  icons: {
    icon: "/mascot.png",
    apple: "/mascot.png",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "MiNegocio Digital",
    title: "MiNegocio Digital",
    description:
      "Asistente de reservas con IA para negocios mexicanos. Atiende a tus clientes 24/7.",
    images: ["/mascot.png"],
  },
  twitter: {
    card: "summary",
    title: "MiNegocio Digital",
    description: "Asistente de reservas con IA para tu negocio.",
    images: ["/mascot.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <LegalFooter />
        <ConsentBanner />
      </body>
    </html>
  );
}
