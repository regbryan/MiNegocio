import { describe, it, expect } from "vitest";
import { scrubPii, scrubMessagesForLlm } from "../pii-scrub";

describe("scrubPii", () => {
  it("redacts a Luhn-valid Visa card number", () => {
    expect(scrubPii("mi tarjeta 4111 1111 1111 1111 ok?")).toContain(
      "[REDACTED_CARD]",
    );
    expect(scrubPii("mi tarjeta 4111 1111 1111 1111 ok?")).not.toContain(
      "1111 1111",
    );
  });

  it("leaves Luhn-invalid digit groups alone (no card replacement)", () => {
    const out = scrubPii("la cita es a las 1234 5678 9012 3456 horas");
    // 1234567890123456 is NOT Luhn-valid → no card redaction
    expect(out).not.toContain("[REDACTED_CARD]");
  });

  it("redacts Mexican CURP", () => {
    expect(scrubPii("mi CURP es BADD110313HCMLNS09 ok")).toContain(
      "[REDACTED_CURP]",
    );
  });

  it("redacts Mexican RFC", () => {
    expect(scrubPii("RFC: ABCD800101XYZ")).toContain("[REDACTED_RFC]");
  });

  it("partially redacts bare digit runs ≥ 11 long (CLABE / account)", () => {
    const out = scrubPii("CLABE 012345678901234567");
    expect(out).toMatch(/01…67/);
    expect(out).not.toContain("012345678901234567");
  });

  it("does NOT scrub phones or emails (booking-needed PII)", () => {
    const out = scrubPii("llámame al 81 1234 5678 o a juan@example.com");
    expect(out).toContain("juan@example.com");
    expect(out).toContain("81 1234 5678");
  });
});

describe("scrubMessagesForLlm", () => {
  it("scrubs user messages with string content", () => {
    const msgs = [
      { role: "user", content: "mi tarjeta 4111 1111 1111 1111" },
      { role: "assistant", content: "cualquier tarjeta es válida 4111 1111 1111 1111" },
    ];
    const out = scrubMessagesForLlm(msgs);
    expect(out[0].content).toContain("[REDACTED_CARD]");
    // Assistant messages are NOT scrubbed
    expect(out[1].content).toContain("4111 1111 1111 1111");
  });

  it("scrubs user messages with parts[] shape", () => {
    const msgs = [
      {
        role: "user",
        parts: [
          { type: "text", text: "card 4111 1111 1111 1111" },
          { type: "text", text: "ok" },
        ],
      },
    ];
    const out = scrubMessagesForLlm(msgs) as Array<{ role: string; parts: Array<{ text?: string }> }>;
    expect(out[0].parts[0].text).toContain("[REDACTED_CARD]");
    expect(out[0].parts[1].text).toBe("ok");
  });
});
