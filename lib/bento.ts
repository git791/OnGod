import { createBentoSdk, jwtAuthProvider, walletAuthProvider } from "@bento.fun/sdk";

const isClient = typeof window !== "undefined";

const BASE_URL = isClient
  ? "/api/markets"
  : (process.env.NEXT_PUBLIC_BENTO_BASE_URL ?? "https://internal-server.bento.fun");

const TOURNAMENTS_URL = isClient
  ? "/api/tournaments"
  : (process.env.NEXT_PUBLIC_BENTO_TOURNAMENTS_URL ?? "https://bento-fun-tournaments-backend-3nku.onrender.com");

const API_KEY = process.env.NEXT_PUBLIC_BENTO_BUILDER_KEY ?? "";

export const bentoPublic = createBentoSdk({
  baseUrl: BASE_URL,
  tournamentsBaseUrl: TOURNAMENTS_URL,
  apiKey: API_KEY,
  auth: walletAuthProvider(() => ({})),
  fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
});

/**
 * Create an authed SDK instance.
 * 
 * Bento Phase 1 uses WalletAuthProvider — headers returned from getAuthHeaders()
 * are attached to every request. For EOA auth we pass the JWT as a Bearer token.
 */
export function createAuthedSdk(jwt: string) {
  return createBentoSdk({
    baseUrl: BASE_URL,
    tournamentsBaseUrl: TOURNAMENTS_URL,
    apiKey: API_KEY,
    auth: jwtAuthProvider({ getAccessToken: () => jwt }),
    fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
  });
}
