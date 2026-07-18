import { createBentoSdk, jwtAuthProvider, walletAuthProvider } from "@bento.fun/sdk";

const isClient = typeof window !== "undefined";

const BASE_URL = isClient
  ? "/api/markets"
  : (process.env.NEXT_PUBLIC_BENTO_BASE_URL ?? "https://internal-server.bento.fun");

const TOURNAMENTS_URL = isClient
  ? "/api/tournaments"
  : (process.env.NEXT_PUBLIC_BENTO_TOURNAMENTS_URL ?? "https://bento-fun-tournaments-backend-3nku.onrender.com");

// Browser requests go through our server-side markets proxy. The proxy injects
// the real Builder key, while the SDK only needs a non-empty placeholder.
const API_KEY = "server-proxy";

let publicSdk: ReturnType<typeof createBentoSdk> | null = null;

/**
 * Creates the public client only in response to browser-side app work. This
 * keeps Next.js from requiring the public Builder key while prerendering pages.
 */
export function getBentoPublic() {
  if (!publicSdk) {
    publicSdk = createBentoSdk({
      baseUrl: BASE_URL,
      tournamentsBaseUrl: TOURNAMENTS_URL,
      apiKey: API_KEY,
      auth: walletAuthProvider(() => ({})),
      fetch: (...args: Parameters<typeof fetch>) => fetch(...args),
    });
  }
  return publicSdk;
}

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
