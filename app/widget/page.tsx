import type { Metadata } from "next";
import { ChatWidget } from "./_components/chat-widget";

export const metadata: Metadata = {
  title: "Widget Demo",
  robots: { index: false, follow: false },
};

export default function WidgetDemoPage() {
  return (
    <main
      id="main"
      role="main"
      aria-label="Demo de widget embebido"
      className="flex flex-col items-center justify-center min-h-dvh bg-black px-6"
    >
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Widget Demo
        </h1>
        <p className="text-white/50 text-sm leading-relaxed">
          Este es un ejemplo de cómo se ve el chat widget embebido en
          cualquier sitio web. Haz clic en el botón de chat en la esquina
          inferior derecha.
        </p>
      </div>
      <ChatWidget />
    </main>
  );
}
