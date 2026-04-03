import { getTenantById, getServices, getStaff, getFaqEntries } from "@/lib/db/queries";
import type { Tenant, Service, Staff, FaqEntry } from "@/lib/types";

// Day-of-week names in Spanish, index 0 = Sunday
const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function formatBusinessHours(tenant: Tenant): string {
  const lines: string[] = [];

  for (let i = 0; i <= 6; i++) {
    const key = String(i);
    const hours = tenant.business_hours[key];
    const dayName = DAY_NAMES_ES[i];
    if (!hours) {
      lines.push(`  ${dayName}: Cerrado`);
    } else {
      lines.push(`  ${dayName}: ${hours.open} - ${hours.close}`);
    }
  }

  if (tenant.break_times && tenant.break_times.length > 0) {
    lines.push("");
    lines.push("  Descansos:");
    for (const bt of tenant.break_times) {
      const dayLabels = bt.days.map((d) => DAY_NAMES_ES[d]).join(", ");
      const label = bt.label ? ` (${bt.label})` : "";
      lines.push(`    ${dayLabels}: ${bt.start} - ${bt.end}${label}`);
    }
  }

  return lines.join("\n");
}

function formatServices(services: Service[]): string {
  if (services.length === 0) return "  (No hay servicios disponibles)";

  // Group by category
  const byCategory: Record<string, Service[]> = {};
  for (const svc of services) {
    const cat = svc.category ?? "General";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(svc);
  }

  const lines: string[] = [];
  for (const [category, svcs] of Object.entries(byCategory)) {
    lines.push(`  [${category}]`);
    for (const svc of svcs) {
      const price = `${svc.currency} ${svc.price.toFixed(2)}`;
      const duration = `${svc.duration_minutes} min`;
      const desc = svc.description ? ` — ${svc.description}` : "";
      lines.push(`    • ${svc.name}: ${price}, ${duration}${desc}`);
    }
  }
  return lines.join("\n");
}

function formatStaff(staffList: Staff[], services: Service[]): string {
  if (staffList.length === 0) return "  (No hay personal registrado)";

  const serviceMap = new Map(services.map((s) => [s.id, s.name]));

  return staffList
    .map((member) => {
      const role = member.role ? ` — ${member.role}` : "";
      const svcNames =
        member.service_ids.length > 0
          ? member.service_ids.map((id) => serviceMap.get(id) ?? id).join(", ")
          : "todos los servicios";
      return `  • ${member.name}${role}\n    Servicios: ${svcNames}`;
    })
    .join("\n");
}

function formatFaqEntries(entries: FaqEntry[]): string {
  if (entries.length === 0) return "  (Sin entradas)";
  return entries
    .map((e) => `  P: ${e.question}\n  R: ${e.answer}`)
    .join("\n\n");
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export async function buildSystemPrompt(tenantId: string): Promise<string> {
  const [tenant, services, staffList, faqEntries] = await Promise.all([
    getTenantById(tenantId),
    getServices(tenantId),
    getStaff(tenantId),
    getFaqEntries(tenantId),
  ]);

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  // Partition FAQ entries by category
  const policyFaqs = faqEntries.filter((e) => e.category === "policy");
  const accessFaqs = faqEntries.filter((e) => e.category === "access");
  const knowledgeFaqs = faqEntries.filter(
    (e) => e.category === "faq" || e.category === "first-visit"
  );

  const fullAddress = [
    tenant.address_street,
    tenant.address_colonia,
    tenant.address_city,
    tenant.address_state,
    tenant.address_zip,
  ]
    .filter(Boolean)
    .join(", ");

  const paymentMethods =
    tenant.payment_methods.length > 0
      ? tenant.payment_methods.join(", ")
      : "Consultar con el negocio";

  const forbiddenTopics =
    tenant.ai_forbidden_topics.length > 0
      ? tenant.ai_forbidden_topics.join(", ")
      : "(ninguno especificado)";

  const bookingModeLabel =
    tenant.booking_mode === "auto"
      ? "auto (confirmación instantánea)"
      : tenant.booking_mode === "manual"
      ? "manual (requiere aprobación del negocio)"
      : "conditional (depende de disponibilidad)";

  const sections: string[] = [
    // ── Section 1: Role & Identity ───────────────────────────────────────────
    `## 1. ROL E IDENTIDAD
You are the AI assistant for ${tenant.business_name}, a ${tenant.vertical} business. ${tenant.description}

### FECHA Y HORA ACTUAL
Hoy es: ${new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Mexico_City" })}
Hora actual: ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" })} (hora de Ciudad de México)
Usa esta información para interpretar frases como "mañana", "el jueves", "la próxima semana", "en la tarde", etc.`,

    // ── Section 2: Customer Identification ───────────────────────────────────
    `## 2. IDENTIFICACIÓN DEL CLIENTE (CRÍTICO)
MANDATORY FIRST STEP: At the start of every conversation, call the lookup_customer tool with the session_id.
- If a customer is found: greet them by name and ask how you can help. Nothing else.
- If no customer found: greet them warmly and ask ONLY their name. Example: "¡Hola! Bienvenido/a. ¿Me podrías compartir tu nombre?"
- After they give their name: call create_customer, then ask how you can help. Do NOT ask for email yet.
- Only ask for email later, when they're about to book (frame it as optional: "¿Tienes un correo para enviarte la confirmación? Es completamente opcional").
- NEVER ask for name AND email in the same message. One thing at a time.`,

    // ── Section 3: Tone & Language ────────────────────────────────────────────
    `## 3. TONO E IDIOMA
Language: ${tenant.ai_language} (es = respond in Spanish, en = English, both = match user's language)
Tone: ${tenant.ai_tone}
Greeting: ${tenant.ai_greeting ?? "¡Hola! Bienvenido/a a " + tenant.business_name + ". ¿En qué te puedo ayudar hoy?"}
Sign-off: ${tenant.ai_signoff ?? "¡Hasta pronto! Si necesitas algo más, no dudes en escribirnos."}

### REGLA CRÍTICA DE CONVERSACIÓN
**Haz SOLO UNA pregunta por mensaje.** Nunca hagas dos o más preguntas en el mismo mensaje.
- ❌ MAL: "¿Cómo te llamas? ¿Y para cuándo te gustaría agendar?"
- ✅ BIEN: "¿Cómo te llamas?"
- (Espera la respuesta, luego pregunta lo siguiente)

Mantén una conversación natural y fluida, como si fueras una recepcionista amable.
No interrogues al cliente — guía la conversación paso a paso.
Cada respuesta debe ser corta (1-3 oraciones máximo) y terminar con una sola pregunta o una confirmación.`,

    // ── Section 4: Services & Pricing ─────────────────────────────────────────
    `## 4. SERVICIOS Y PRECIOS
${formatServices(services)}`,

    // ── Section 5: Business Hours ─────────────────────────────────────────────
    `## 5. HORARIO DE ATENCIÓN
${formatBusinessHours(tenant)}`,

    // ── Section 6: Staff ──────────────────────────────────────────────────────
    `## 6. PERSONAL
${formatStaff(staffList, services)}`,

    // ── Section 7: Booking Rules ──────────────────────────────────────────────
    `## 7. REGLAS DE RESERVACIÓN
- Bookings can be made up to ${tenant.max_advance_days} days in advance
- Minimum ${tenant.min_notice_hours} hours notice required
- ${tenant.buffer_minutes} minutes buffer between appointments
- Booking mode: ${bookingModeLabel}
- Maximum ${tenant.max_concurrent} simultaneous appointments`,

    // ── Section 8: Payment & Policies ─────────────────────────────────────────
    `## 8. PAGOS Y POLÍTICAS
Payment methods: ${paymentMethods}
Tax included: ${tenant.tax_included ? "Sí, el precio ya incluye impuestos" : "No, los precios no incluyen impuestos"}
${tenant.extra_fee_notes ? `Additional fees: ${tenant.extra_fee_notes}` : ""}
${policyFaqs.length > 0 ? "\nPolíticas:\n" + formatFaqEntries(policyFaqs) : ""}`.trim(),

    // ── Section 9: Location & Directions ─────────────────────────────────────
    `## 9. UBICACIÓN Y CÓMO LLEGAR
Address: ${fullAddress}
${tenant.phone ? `Phone: ${tenant.phone}` : ""}
${tenant.whatsapp_number ? `WhatsApp: ${tenant.whatsapp_number}` : ""}
${tenant.social_links?.google_maps ? `Google Maps: ${tenant.social_links.google_maps}` : ""}
${accessFaqs.length > 0 ? "\nInstrucciones de acceso:\n" + formatFaqEntries(accessFaqs) : ""}`.trim(),

    // ── Section 10: FAQ Knowledge ─────────────────────────────────────────────
    `## 10. CONOCIMIENTO FAQ
${tenant.first_visit_instructions ? `Primera visita: ${tenant.first_visit_instructions}\n` : ""}${knowledgeFaqs.length > 0 ? formatFaqEntries(knowledgeFaqs) : "  (Sin preguntas frecuentes)"}`.trim(),

    // ── Section 11: Guardrails & Boundaries ──────────────────────────────────
    `## 11. LÍMITES Y REGLAS DE COMPORTAMIENTO
- Never discuss: ${forbiddenTopics}
- ${tenant.complaint_handling ?? "Handle complaints with empathy. Acknowledge the issue, apologize, and offer a solution."}
- Auto-escalate complaints: ${tenant.auto_escalate_complaints ? "Yes — call escalate_to_human immediately when a complaint is detected" : "No — try to resolve first, then escalate if unresolved"}
- Stay on topic — only discuss this business's services
- Never discuss competitors
- Offer human handoff for complex issues by calling escalate_to_human`,

    // ── Section 12: Available Tools ───────────────────────────────────────────
    `## 12. HERRAMIENTAS DISPONIBLES
You have access to the following 6 tools:
1. **lookup_customer** — Look up the current customer by their session. Call this at the start of every conversation.
2. **create_customer** — Create a new customer record and link them to the current conversation.
3. **list_services** — List all available services for this business, optionally filtered by category.
4. **check_availability** — Check available appointment slots for a given date, optionally filtered by service or staff.
5. **create_booking** — Book an appointment for a customer at a specific date and time.
6. **escalate_to_human** — Escalate the conversation to a human agent when the AI cannot resolve the customer's issue.`,
  ];

  return sections.join("\n\n");
}
