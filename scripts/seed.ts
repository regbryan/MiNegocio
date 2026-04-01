import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Seeding Salon Maria demo business...\n");

  // ────────────────────────────────────────────────
  // 1. Delete existing data for slug='salon-maria'
  // ────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", "salon-maria")
    .maybeSingle();

  if (existing) {
    const { error: deleteError } = await supabase
      .from("tenants")
      .delete()
      .eq("id", existing.id);
    if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
    console.log("Deleted existing Salon Maria tenant (cascaded children).");
  } else {
    console.log("No existing Salon Maria tenant found — inserting fresh.");
  }

  // ────────────────────────────────────────────────
  // 2. Insert tenant
  // ────────────────────────────────────────────────
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      slug: "salon-maria",
      business_name: "Salon Maria",
      vertical: "salon",
      description:
        "Salon de belleza profesional en la Condesa, CDMX. Cortes, color, manicure y mas.",
      address_street: "Calle Tamaulipas 78",
      address_colonia: "Col. Condesa",
      address_city: "Ciudad de Mexico",
      address_state: "CDMX",
      address_zip: "06140",
      phone: "+52 55 1234 5678",
      business_hours: {
        "0": null,
        "1": { open: "09:00", close: "19:00" },
        "2": { open: "09:00", close: "19:00" },
        "3": { open: "09:00", close: "19:00" },
        "4": { open: "09:00", close: "19:00" },
        "5": { open: "09:00", close: "19:00" },
        "6": { open: "09:00", close: "15:00" },
      },
      break_times: [
        { days: [1, 2, 3, 4, 5], start: "14:00", end: "15:00", label: "Comida" },
      ],
      max_advance_days: 30,
      min_notice_hours: 2,
      buffer_minutes: 15,
      max_concurrent: 2,
      ai_language: "es",
      ai_tone: "friendly",
      ai_greeting: "Hola, bienvenido a Salon Maria! En que te puedo ayudar?",
      ai_signoff: "Te esperamos con mucho gusto!",
      ai_forbidden_topics: ["politica", "religion", "competidores"],
      complaint_handling:
        "Escucha con empatia, ofrece disculpas, y ofrece escalamiento al dueno si el cliente no esta satisfecho.",
      auto_escalate_complaints: true,
      booking_mode: "auto",
      payment_methods: ["cash", "card", "spei"],
      tax_included: true,
      first_visit_instructions:
        "El salon esta en el segundo piso. Sube por las escaleras a la derecha de la entrada principal.",
    })
    .select("id")
    .single();

  if (tenantError) throw new Error(`Tenant insert failed: ${tenantError.message}`);
  const tenantId = tenant.id;
  console.log(`Inserted tenant: ${tenantId}`);

  // ────────────────────────────────────────────────
  // 3. Insert services
  // ────────────────────────────────────────────────
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .insert([
      {
        tenant_id: tenantId,
        name: "Corte de cabello",
        price: 250,
        currency: "MXN",
        duration_minutes: 45,
        category: "corte",
        available_days: [1, 2, 3, 4, 5, 6],
        active: true,
      },
      {
        tenant_id: tenantId,
        name: "Color completo",
        price: 600,
        currency: "MXN",
        duration_minutes: 90,
        category: "color",
        available_days: [1, 2, 3, 4, 5, 6],
        active: true,
      },
      {
        tenant_id: tenantId,
        name: "Blowout",
        price: 180,
        currency: "MXN",
        duration_minutes: 30,
        category: "peinado",
        available_days: [1, 2, 3, 4, 5, 6],
        active: true,
      },
      {
        tenant_id: tenantId,
        name: "Manicure",
        price: 150,
        currency: "MXN",
        duration_minutes: 40,
        category: "unas",
        available_days: [1, 2, 3, 4, 5, 6],
        active: true,
      },
      {
        tenant_id: tenantId,
        name: "Paquete Wash+Cut+Blowout",
        price: 400,
        currency: "MXN",
        duration_minutes: 75,
        category: "paquete",
        available_days: [1, 2, 3, 4, 5, 6],
        active: true,
      },
    ])
    .select("id, name, category");

  if (servicesError) throw new Error(`Services insert failed: ${servicesError.message}`);

  const corteId = services.find((s) => s.category === "corte")!.id;
  const colorId = services.find((s) => s.category === "color")!.id;
  const allServiceIds = services.map((s) => s.id);

  console.log(`Inserted ${services.length} services.`);
  services.forEach((s) => console.log(`  - ${s.name} (${s.id})`));

  // ────────────────────────────────────────────────
  // 4. Insert staff
  // ────────────────────────────────────────────────
  const { data: staffRows, error: staffError } = await supabase
    .from("staff")
    .insert([
      {
        tenant_id: tenantId,
        name: "Maria",
        role: "Dueña / Estilista",
        service_ids: allServiceIds,
        active: true,
      },
      {
        tenant_id: tenantId,
        name: "Ana",
        role: "Colorista",
        service_ids: [colorId],
        schedule_override: {
          "0": null,
          "1": null,
          "2": { open: "09:00", close: "19:00" },
          "3": { open: "09:00", close: "19:00" },
          "4": { open: "09:00", close: "19:00" },
          "5": { open: "09:00", close: "19:00" },
          "6": { open: "09:00", close: "15:00" },
        },
        active: true,
      },
      {
        tenant_id: tenantId,
        name: "Luis",
        role: "Barbero",
        service_ids: [corteId],
        // Note: includes Sunday — intentional edge case (business is closed Sunday)
        schedule_override: {
          "0": { open: "09:00", close: "15:00" },
          "1": null,
          "2": null,
          "3": null,
          "4": { open: "09:00", close: "19:00" },
          "5": { open: "09:00", close: "19:00" },
          "6": { open: "09:00", close: "15:00" },
        },
        active: true,
      },
    ])
    .select("id, name");

  if (staffError) throw new Error(`Staff insert failed: ${staffError.message}`);
  console.log(`Inserted ${staffRows.length} staff members.`);
  staffRows.forEach((s) => console.log(`  - ${s.name} (${s.id})`));

  // ────────────────────────────────────────────────
  // 5. Insert FAQ entries
  // ────────────────────────────────────────────────
  const { data: faqRows, error: faqError } = await supabase
    .from("faq_entries")
    .insert([
      {
        tenant_id: tenantId,
        question: "Donde puedo estacionar?",
        answer:
          "Hay estacionamiento publico en la calle de Tamaulipas a media cuadra del salon. También hay parquimetros disponibles.",
        category: "access",
      },
      {
        tenant_id: tenantId,
        question: "Es accesible para sillas de ruedas?",
        answer:
          "Desafortunadamente el salon esta en el segundo piso sin elevador. Estamos buscando opciones para mejorar la accesibilidad.",
        category: "access",
      },
      {
        tenant_id: tenantId,
        question: "Cual es su politica de cancelacion?",
        answer:
          "Pedimos aviso de al menos 4 horas para cancelaciones. Cancelaciones de ultima hora pueden tener un cargo del 50% del servicio.",
        category: "policy",
      },
      {
        tenant_id: tenantId,
        question: "Aceptan sin cita?",
        answer:
          "Atendemos con cita previa para garantizar disponibilidad. Sin embargo, si hay espacio disponible podemos atender sin cita.",
        category: "policy",
      },
      {
        tenant_id: tenantId,
        question: "Que debo saber para mi primera visita?",
        answer:
          "Llega 10 minutos antes de tu cita. El salon esta en el segundo piso, sube por las escaleras a la derecha. Si tienes alguna alergia o condicion del cuero cabelludo, por favor mencionala al llegar.",
        category: "first-visit",
      },
      {
        tenant_id: tenantId,
        question: "Que metodos de pago aceptan?",
        answer:
          "Aceptamos efectivo, tarjeta de credito/debito y transferencia SPEI.",
        category: "faq",
      },
      {
        tenant_id: tenantId,
        question: "Tienen WiFi?",
        answer:
          "Si, ofrecemos WiFi gratuito para nuestros clientes. La contraseña esta disponible en el salon.",
        category: "faq",
      },
      {
        tenant_id: tenantId,
        question: "Puedo llevar a mis hijos?",
        answer:
          "Si, los ninos son bienvenidos. Tenemos un area de espera con revistas y entretenimiento.",
        category: "faq",
      },
      {
        tenant_id: tenantId,
        question: "Hacen servicios a domicilio?",
        answer:
          "Por el momento solo ofrecemos servicios en el salon. Estamos evaluando opciones de servicio a domicilio para el futuro.",
        category: "faq",
      },
      {
        tenant_id: tenantId,
        question: "Tienen productos a la venta?",
        answer:
          "Si, vendemos productos profesionales para el cuidado del cabello. Pregunta a tu estilista por recomendaciones personalizadas.",
        category: "faq",
      },
    ])
    .select("id");

  if (faqError) throw new Error(`FAQ insert failed: ${faqError.message}`);
  console.log(`Inserted ${faqRows.length} FAQ entries.`);

  // ────────────────────────────────────────────────
  // 6. Summary
  // ────────────────────────────────────────────────
  console.log("\n--- Seed complete ---");
  console.log(`Tenant ID : ${tenantId}`);
  console.log(`Services  : ${services.length}`);
  console.log(`Staff     : ${staffRows.length}`);
  console.log(`FAQ       : ${faqRows.length}`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
