import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "mn_sid";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_VERSION = "v1";

function secret(): Buffer {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SESSION_SECRET env var must be set to a value ≥ 32 characters in production.",
      );
    }
    // Dev fallback: deterministic-but-loud secret so devs notice the warning.
    return Buffer.from("dev-only-session-secret-do-not-ship-32+chars");
  }
  return Buffer.from(raw);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function mint(): string {
  const id = randomBytes(18).toString("base64url"); // 144 bits of entropy
  const payload = `${SESSION_VERSION}.${id}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [version, id, mac] = parts;
  if (version !== SESSION_VERSION) return null;
  const expected = sign(`${version}.${id}`);
  if (mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  // Return the opaque session id only — never the raw token.
  return id;
}

/**
 * Read the signed cookie; if absent or tampered, mint a new one and persist it.
 * Returns the verified session id (not the cookie value).
 */
export async function getOrIssueSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  const verified = verifySessionToken(existing);
  if (verified) return verified;

  const fresh = mint();
  jar.set(COOKIE_NAME, fresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return verifySessionToken(fresh)!;
}

/**
 * Server-action / route-handler helper: returns null if no valid signed cookie
 * is present. Use this in mutating endpoints to refuse unauthenticated callers.
 */
export async function requireSessionId(): Promise<string | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE_NAME)?.value);
}
