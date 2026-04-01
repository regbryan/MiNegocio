import { getTenantBySlug } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { ChatInterface } from "./_components/chat-interface";

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
    <ChatInterface tenantSlug={tenantSlug} businessName={tenant.business_name} />
  );
}
