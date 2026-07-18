// @ts-nocheck
import { createBentoSdk } from "@bento.fun/sdk";

async function main() {
  const BASE_URL = "https://internal-server.bento.fun";
  const API_KEY = "bnt_live_3bb11fd4_0fce953f5b872fba7f60ed75";

  const sdk = createBentoSdk({
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    fetch: async (...args) => {
      console.log("SDK is fetching:", args[0]);
      return fetch(...args);
    }
  });

  try {
    await sdk.public.externalLink.getLinkUrl({
      returnUrl: "http://localhost:3000",
      state: "123",
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

main().catch(console.error);
