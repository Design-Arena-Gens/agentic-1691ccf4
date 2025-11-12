import { cookies } from "next/headers";
import type { GoogleTokens } from "./google";
import { deserializeTokens } from "./google";

const TOKEN_COOKIE = "g_tokens";

export function getStoredTokens(): GoogleTokens | null {
  const store = cookies();
  const encoded = store.get(TOKEN_COOKIE)?.value;
  return deserializeTokens(encoded ?? null);
}

export function clearStoredTokens() {
  const store = cookies();
  store.delete(TOKEN_COOKIE);
}

export function hasStoredTokens() {
  return !!getStoredTokens();
}

export function tokenCookieName() {
  return TOKEN_COOKIE;
}
