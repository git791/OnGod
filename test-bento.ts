// @ts-nocheck
import { createBentoSdk, jwtAuthProvider } from "@bento.fun/sdk";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

async function signBentoMessage(address: string, pk: any): Promise<{ signature: string; timestamp: string }> {
  const timestamp = Date.now().toString();
  const message = `Bento.fun Login\nTimestamp: ${timestamp}\nWallet: ${address}`;
  const signature = await pk.signMessage({ message });
  return { signature, timestamp };
}

async function main() {
  console.log("Starting test...");
  const BASE_URL = process.env.NEXT_PUBLIC_BENTO_BASE_URL;
  const API_KEY = process.env.NEXT_PUBLIC_BENTO_BUILDER_KEY;
  
  const pkey = generatePrivateKey();
  const account = privateKeyToAccount(pkey);
  const address = account.address;
  
  console.log("Registering EOA...");
  const { signature, timestamp } = await signBentoMessage(address, account);
  const username = `og_${address.slice(2, 10).toLowerCase()}`;
  
  const res = await fetch(`${BASE_URL}/bento/user/auth/eoa/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-builder-api-key": API_KEY!,
    },
    body: JSON.stringify({
      address,
      signature,
      timestamp,
      username,
    }),
  });
  
  const data = await res.json();
  const jwt = data.token || data.accessToken || data.jwt;
  if (!jwt) {
    console.log("Registration failed:", data);
    return;
  }
  
  const authedSdk = createBentoSdk({
    baseUrl: BASE_URL!,
    apiKey: API_KEY!,
    auth: jwtAuthProvider({ getAccessToken: () => jwt }),
    fetch: async (...args) => {
      const fetchRes = await fetch(...args);
      if (!fetchRes.ok) {
        const text = await fetchRes.clone().text();
        console.log(`BENTO AUTHED ERROR [${fetchRes.status}]:`, text);
      }
      return fetchRes;
    }
  });

  // console.log("Minting tokens...");
  // skip minting

  const startTime = new Date(Date.now() + 8 * 60 * 1000).toISOString();
  const endTime = new Date(Date.now() + 186400000).toISOString();
  const claim = "Test Claim";

  console.log("Creating duel...");
  try {
    const duelResult = await authedSdk.user.createDuel(
      {
        question: claim,
        type: "prediction",
        category: "Football",
        optionA: "Yes",
        optionB: "No",
        startTime: startTime,
        endTime,
        privacyAccess: "private",
        collateralMode: "credits",
      },
      { requestId: `duel-${Date.now()}` }
    );
    console.log("Success:", duelResult.raw);
  } catch (e: any) {
    console.log("Caught SDK Exception:", e.message);
  }
}

main().catch(console.error);
