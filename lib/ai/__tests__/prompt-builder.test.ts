import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSystemPrompt } from "../prompt-builder";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db/queries", () => ({
  getTenantById: vi.fn(),
  getServices: vi.fn(),
  getStaff: vi.fn(),
  getFaqEntries: vi.fn(),
}));

import {
  getTenantById,
  getServices,
  getStaff,
  getFaqEntries,
} from "@/lib/db/queries";

// ---------------------------------------------------------------------------
// Salon Maria fixture
// ---------------------------------------------------------------------------

const TENANT_ID = "tenant-salon-maria";

const mockTenant = {
  id: TENANT_ID,
  slug: "salon-maria",
  business_name: "Salon Maria",
  vertical: "beauty salon",
  description:
    "El mejor salón de belleza en el centro de Monterrey. Ofrecemos cortes, tintes, uñas y más.",
  address_street: "Av. Constitución 405",
  address_colonia: "Centro",
  address_city: "Monterrey",
  address_state: "Nuevo León",
  address_zip: "64000",
  phone: "+52 81 1234 5678",
  whatsapp_number: "+52 81 1234 5678",
  social_links: {
    facebook: "https://facebook.com/salonmaria",
    instagram: "https://instagram.com/salonmaria",
    google_maps: "https://maps.google.com/?q=Salon+Maria+Monterrey",
  },
  business_hours: {
    "0": null, // Sunday closed
    "1": { open: "09:00", close: "19:00" }, // Monday
    "2": { open: "09:00", close: "19:00" }, // Tuesday
    "3": { open: "09:00", close: "19:00" }, // Wednesday
    "4": { open: "09:00", close: "19:00" }, // Thursday
    "5": { open: "09:00", close: "19:00" }, // Friday
    "6": { open: "09:00", close: "15:00" }, // Saturday
  },
  break_times: [
    {
      days: [1, 2, 3, 4, 5],
      start: "14:00",
      end: "15:00",
      label: "Comida",
    },
  ],
  max_advance_days: 30,
  min_notice_hours: 2,
  buffer_minutes: 15,
  max_concurrent: 3,
  ai_language: "es",
  ai_tone: "amigable y profesional",
  ai_greeting: "¡Hola! Bienvenida a Salon Maria. ¿En qué te puedo ayudar hoy?",
  ai_signoff: "¡Hasta pronto! Esperamos verte pronto en Salon Maria.",
  ai_forbidden_topics: ["política", "religión", "competidores"],
  complaint_handling:
    "Escucha con empatía, pide disculpas y ofrece una solución o reembolso según corresponda.",
  auto_escalate_complaints: true,
  booking_mode: "auto" as const,
  payment_methods: ["efectivo", "tarjeta", "transferencia"],
  tax_included: true,
  extra_fee_notes: "Servicio a domicilio tiene costo adicional de $150 MXN",
  first_visit_instructions:
    "En tu primera visita, llega 10 minutos antes. Trae identificación oficial.",
  created_at: "2024-01-01T00:00:00Z",
};

const mockServices = [
  {
    id: "svc-1",
    tenant_id: TENANT_ID,
    name: "Corte de Cabello",
    description: "Incluye lavado y secado",
    price: 250,
    currency: "MXN",
    duration_minutes: 45,
    category: "Cabello",
    available_days: [1, 2, 3, 4, 5, 6],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "svc-2",
    tenant_id: TENANT_ID,
    name: "Tinte Completo",
    description: null,
    price: 750,
    currency: "MXN",
    duration_minutes: 120,
    category: "Cabello",
    available_days: [1, 2, 3, 4, 5, 6],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "svc-3",
    tenant_id: TENANT_ID,
    name: "Manicure",
    description: "Uñas manos con esmaltado",
    price: 180,
    currency: "MXN",
    duration_minutes: 60,
    category: "Uñas",
    available_days: [1, 2, 3, 4, 5, 6],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

const mockStaff = [
  {
    id: "staff-1",
    tenant_id: TENANT_ID,
    name: "María García",
    role: "Estilista Senior",
    service_ids: ["svc-1", "svc-2"],
    schedule_override: null,
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "staff-2",
    tenant_id: TENANT_ID,
    name: "Laura Torres",
    role: "Técnica en Uñas",
    service_ids: ["svc-3"],
    schedule_override: null,
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

const mockFaqEntries = [
  {
    id: "faq-1",
    tenant_id: TENANT_ID,
    question: "¿Puedo cancelar mi cita?",
    answer: "Sí, con al menos 2 horas de anticipación sin cargo.",
    category: "policy" as const,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "faq-2",
    tenant_id: TENANT_ID,
    question: "¿Tienen estacionamiento?",
    answer: "Sí, hay estacionamiento gratuito frente al local.",
    category: "access" as const,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "faq-3",
    tenant_id: TENANT_ID,
    question: "¿Cuánto dura el tinte?",
    answer: "El tinte completo dura aproximadamente 2 horas.",
    category: "faq" as const,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "faq-4",
    tenant_id: TENANT_ID,
    question: "¿Qué debo traer en mi primera visita?",
    answer: "Trae identificación oficial y llega 10 minutos antes.",
    category: "first-visit" as const,
    created_at: "2024-01-01T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildSystemPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTenantById).mockResolvedValue(mockTenant as any);
    vi.mocked(getServices).mockResolvedValue(mockServices as any);
    vi.mocked(getStaff).mockResolvedValue(mockStaff as any);
    vi.mocked(getFaqEntries).mockResolvedValue(mockFaqEntries as any);
  });

  it("calls all four DB queries with the correct tenantId", async () => {
    await buildSystemPrompt(TENANT_ID);

    expect(getTenantById).toHaveBeenCalledWith(TENANT_ID);
    expect(getServices).toHaveBeenCalledWith(TENANT_ID);
    expect(getStaff).toHaveBeenCalledWith(TENANT_ID);
    expect(getFaqEntries).toHaveBeenCalledWith(TENANT_ID);
  });

  it("throws when tenant is not found", async () => {
    vi.mocked(getTenantById).mockResolvedValue(null);

    await expect(buildSystemPrompt(TENANT_ID)).rejects.toThrow(
      `Tenant not found: ${TENANT_ID}`
    );
  });

  describe("Section 1 — Business identity", () => {
    it("includes business name, vertical, and description", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Salon Maria");
      expect(prompt).toContain("beauty salon");
      expect(prompt).toContain(
        "El mejor salón de belleza en el centro de Monterrey"
      );
    });
  });

  describe("Section 2 — Customer identification", () => {
    it("includes mandatory first-step instructions to call lookup_customer", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("MANDATORY FIRST STEP");
      expect(prompt).toContain("lookup_customer");
      expect(prompt).toContain("create_customer");
    });

    it("includes the Spanish name prompt phrase", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("¿Me podrías compartir tu nombre?");
    });

    it("includes the optional email ask", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("correo para enviarte la confirmación");
      expect(prompt).toContain("completamente opcional");
    });
  });

  describe("Section 3 — Tone & Language", () => {
    it("includes language setting", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      // Tenant-controlled strings are wrapped in <<< … >>> per Phase 4.5.
      expect(prompt).toContain("Language: <<<es>>>");
    });

    it("includes tone", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("amigable y profesional");
    });

    it("includes greeting", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain(
        "¡Hola! Bienvenida a Salon Maria. ¿En qué te puedo ayudar hoy?"
      );
    });

    it("includes sign-off", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Esperamos verte pronto en Salon Maria");
    });

    it("uses default greeting when ai_greeting is null", async () => {
      vi.mocked(getTenantById).mockResolvedValue({
        ...mockTenant,
        ai_greeting: null,
        ai_signoff: null,
      } as any);

      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Bienvenido/a a Salon Maria");
    });
  });

  describe("Section 4 — Services & Pricing", () => {
    it("includes all service names", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Corte de Cabello");
      expect(prompt).toContain("Tinte Completo");
      expect(prompt).toContain("Manicure");
    });

    it("includes service prices with currency", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("MXN 250.00");
      expect(prompt).toContain("MXN 750.00");
      expect(prompt).toContain("MXN 180.00");
    });

    it("includes service durations", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("45 min");
      expect(prompt).toContain("120 min");
    });

    it("groups services by category", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("[Cabello]");
      expect(prompt).toContain("[Uñas]");
    });

    it("handles services with no category as General", async () => {
      vi.mocked(getServices).mockResolvedValue([
        { ...mockServices[0], category: null } as any,
      ]);

      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("[General]");
    });
  });

  describe("Section 5 — Business Hours", () => {
    it("formats open days with hours", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Lunes: 09:00 - 19:00");
      expect(prompt).toContain("Sábado: 09:00 - 15:00");
    });

    it("marks closed days", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Domingo: Cerrado");
    });

    it("includes break times", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("14:00 - 15:00");
      expect(prompt).toContain("Comida");
    });
  });

  describe("Section 6 — Staff", () => {
    it("includes all staff names", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("María García");
      expect(prompt).toContain("Laura Torres");
    });

    it("includes staff roles", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Estilista Senior");
      expect(prompt).toContain("Técnica en Uñas");
    });

    it("maps staff service IDs to service names", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Corte de Cabello");
      expect(prompt).toContain("Manicure");
    });
  });

  describe("Section 7 — Booking Rules", () => {
    it("includes advance booking limit", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("30 days in advance");
    });

    it("includes minimum notice hours", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Minimum 2 hours notice");
    });

    it("includes buffer minutes", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("15 minutes buffer");
    });

    it("includes booking mode with auto label", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("auto (confirmación instantánea)");
    });

    it("includes max concurrent appointments", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Maximum 3 simultaneous");
    });
  });

  describe("Section 8 — Payment & Policies", () => {
    it("includes payment methods", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("efectivo");
      expect(prompt).toContain("tarjeta");
      expect(prompt).toContain("transferencia");
    });

    it("includes tax_included indicator", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Sí, el precio ya incluye impuestos");
    });

    it("includes extra_fee_notes", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Servicio a domicilio");
    });

    it("includes policy FAQ entries", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("¿Puedo cancelar mi cita?");
      expect(prompt).toContain("2 horas de anticipación");
    });
  });

  describe("Section 9 — Location & Directions", () => {
    it("includes full address", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Av. Constitución 405");
      expect(prompt).toContain("Monterrey");
      expect(prompt).toContain("Nuevo León");
    });

    it("includes access FAQ entries", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("¿Tienen estacionamiento?");
      expect(prompt).toContain("estacionamiento gratuito");
    });
  });

  describe("Section 10 — FAQ Knowledge", () => {
    it("includes general FAQ entries", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("¿Cuánto dura el tinte?");
    });

    it("includes first-visit FAQ entries", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("¿Qué debo traer en mi primera visita?");
    });

    it("includes first_visit_instructions", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain(
        "En tu primera visita, llega 10 minutos antes"
      );
    });
  });

  describe("Section 11 — Guardrails & Boundaries", () => {
    it("includes forbidden topics", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("política");
      expect(prompt).toContain("religión");
      expect(prompt).toContain("competidores");
    });

    it("includes complaint handling instructions", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("Escucha con empatía");
    });

    it("includes auto_escalate_complaints setting when true", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain(
        "call escalate_to_human immediately when a complaint is detected"
      );
    });

    it("mentions escalate_to_human tool", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("escalate_to_human");
    });
  });

  describe("Section 12 — Available Tools", () => {
    it("lists all 6 tool names", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      expect(prompt).toContain("lookup_customer");
      expect(prompt).toContain("create_customer");
      expect(prompt).toContain("list_services");
      expect(prompt).toContain("check_availability");
      expect(prompt).toContain("create_booking");
      expect(prompt).toContain("escalate_to_human");
    });

    it("contains a description for each tool", async () => {
      const prompt = await buildSystemPrompt(TENANT_ID);

      // Each tool has a brief description
      expect(prompt).toContain("Look up the current customer");
      expect(prompt).toContain("Create a new customer record");
      expect(prompt).toContain("List all available services");
      expect(prompt).toContain("Check available appointment slots");
      expect(prompt).toContain("Book an appointment");
      expect(prompt).toContain("Escalate the conversation");
    });
  });
});
