import type { Metadata } from "next";
import { getTenantBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { AiDisclosure } from "@/components/legal/ai-disclosure";
import { ChatInterface } from "./_components/chat-interface";

// Per-tenant metadata. Next.js doesn't allow `metadata` and
// `generateMetadata` to coexist in the same file, so this owns both
// the title (which the static const couldn't do) and the noindex flag.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return { robots: { index: false, follow: false } };
  return {
    title: `Chat · ${tenant.business_name}`,
    description: `Habla con el asistente de ${tenant.business_name} para reservar, preguntar horarios o ver servicios.`,
    robots: { index: false, follow: false },
  };
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return (
    <main
      id="main"
      role="main"
      aria-label={`Chat con ${tenant.business_name}`}
      className="flex flex-1 flex-col"
    >
      <h1 className="sr-only">{tenant.business_name}</h1>
      <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-1">
        <AiDisclosure tenantName={tenant.business_name} />
      </div>
      <ChatInterface
        tenantSlug={tenantSlug}
        businessName={tenant.business_name}
      />
    </main>
  );
}
