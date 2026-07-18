import { createBentoSdk, jwtAuthProvider } from "@bento.fun/sdk";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

async function signBentoMessage(address, pk) {
  const timestamp = Date.now().toString();
  const message = `Bento.fun Login\nTimestamp: ${timestamp}\nWallet: ${address}`;
  const signature = await pk.signMessage({ message });
  return { signature, timestamp };
}

async function main() {
  const BASE_URL = "https://internal-server.bento.fun";
  const API_KEY = "bnt_live_b377e4a1_04d9e7bced74d523b086230f"; // from .env.local
  
  const pkey = generatePrivateKey();
  const account = privateKeyToAccount(pkey);
  const address = account.address;
  
  console.log("Registering...", address);
  const { signature, timestamp } = await signBentoMessage(address, account);
  const username = `og_${address.slice(2, 10).toLowerCase()}`;
  
  const res = await fetch(`${BASE_URL}/bento/user/auth/eoa/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-builder-api-key": API_KEY,
    },
    body: JSON.stringify({ address, signature, timestamp, username }),
  });
  
  const data = await res.json();
  const jwt = data.token || data.accessToken || data.jwt;
  if (!jwt) {
    console.log("Registration failed:", data);
    return;
  }
  
  const authedSdk = createBentoSdk({
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    auth: jwtAuthProvider({ getAccessToken: () => jwt })
  });

  console.log("Minting tokens...");
  const mintRes = await fetch(`${BASE_URL}/bento/auto-mint/mint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-builder-api-key": API_KEY,
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ userAddress: address }),
  });
  console.log("Mint Status:", mintRes.status, await mintRes.text());

  const startTime = new Date(Date.now() + 8 * 60 * 1000).toISOString();
  const endTime = new Date(Date.now() + 186400000).toISOString();

  console.log("Creating duel...");
  try {
    const duelResult = await authedSdk.user.createDuel(
      {
        question: "Is this working?",
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
    console.log("Success!", duelResult.raw);
  } catch (e) {
    console.log("Failed:", e.message);
    if (e.sdkError) {
      console.log("SDK Error Details:", JSON.stringify(e.sdkError, null, 2));
    }
  }
}

main().catch(console.error);
