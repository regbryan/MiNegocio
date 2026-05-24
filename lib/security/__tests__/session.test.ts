import { describe, it, expect, beforeAll } from "vitest";
import { createHmac, randomBytes } from "node:crypto";

beforeAll(() => {
  process.env.SESSION_SECRET =
    "test-secret-must-be-long-enough-to-meet-32-char-threshold-aaa";
});

// We have to import lazily so the env var above is read at module init.
async function importMod() {
  return await import("../session");
}

describe("session token signing", () => {
  it("verifies a freshly minted token", async () => {
    // Mint manually using the same secret + scheme to assert verifySessionToken.
    const id = randomBytes(18).toString("base64url");
    const payload = `v1.${id}`;
    const mac = createHmac("sha256", process.env.SESSION_SECRET!)
      .update(payload)
      .digest("base64url");
    const token = `${payload}.${mac}`;
    const { verifySessionToken } = await importMod();
    expect(verifySessionToken(token)).toBe(id);
  });

  it("rejects tampered MAC", async () => {
    const id = randomBytes(18).toString("base64url");
    const payload = `v1.${id}`;
    const mac = createHmac("sha256", "wrong-secret-of-sufficient-length-xxx")
      .update(payload)
      .digest("base64url");
    const { verifySessionToken } = await importMod();
    expect(verifySessionToken(`${payload}.${mac}`)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    const { verifySessionToken } = await importMod();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("only-one-part")).toBeNull();
    expect(verifySessionToken("v1.id.mac.extra")).toBeNull();
    expect(verifySessionToken("v0.id.mac")).toBeNull();
  });

  it("rejects mismatched-length MAC without leaking timing", async () => {
    const id = randomBytes(18).toString("base64url");
    const { verifySessionToken } = await importMod();
    expect(verifySessionToken(`v1.${id}.short`)).toBeNull();
  });
});
