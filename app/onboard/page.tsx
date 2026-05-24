import type { Metadata } from "next";
import { AiDisclosure } from "@/components/legal/ai-disclosure";
import { OnboardChat } from "./_components/onboard-chat";

export const metadata: Metadata = {
  title: "Registrar mi negocio",
  robots: { index: false, follow: false },
};

export default function OnboardPage() {
  return (
    <main
      id="main"
      role="main"
      aria-label="Asistente de registro de negocio"
      className="flex flex-1 flex-col"
    >
      <h1 className="sr-only">Registrar mi negocio</h1>
      <div className="mx-auto w-full max-w-3xl px-4 pt-3">
        <AiDisclosure />
      </div>
      <OnboardChat />
    </main>
  );
}
