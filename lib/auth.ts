/**
 * Bento EOA Authentication
 * 
 * Flow:
 *  1. Build the sign message: "Bento.fun Login\nTimestamp: {ts}\nWallet: {address}"
 *  2. Sign with viem's signMessage
 *  3. POST to /bento/user/auth/eoa/login (or /register)
 *  4. JWT comes back in the response body or headers (we handle both)
 */

import { getBurnerAccount, getBurnerPrivateKey } from "./wallet";

const isClient = typeof window !== "undefined";

const BASE_URL = isClient
  ? "/api/markets"
  : (process.env.NEXT_PUBLIC_BENTO_BASE_URL ?? "https://internal-server.bento.fun");

const API_KEY = process.env.NEXT_PUBLIC_BENTO_BUILDER_KEY ?? "";

function buildMessage(address: string, timestamp: string): string {
  return `Bento.fun Login\nTimestamp: ${timestamp}\nWallet: ${address}`;
}

async function signBentoMessage(address: string): Promise<{ signature: string; timestamp: string }> {
  const { signMessage } = await import("viem/accounts");
  const pk = getBurnerPrivateKey();
  if (!pk) throw new Error("No private key");

  const timestamp = Date.now().toString();
  const message = buildMessage(address, timestamp);
  const signature = await signMessage({ message, privateKey: pk });
  return { signature, timestamp };
}

async function fetchAuth(
  path: string,
  body: Record<string, unknown>
): Promise<{ token?: string; accessToken?: string; managedAddress?: string }> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-builder-api-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  // JWT may be in body
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // body might be empty
  }

  // JWT may also be in headers
  const headerToken =
    res.headers.get("authorization")?.replace(/^Bearer /i, "") ||
    res.headers.get("x-auth-token") ||
    res.headers.get("x-access-token") ||
    undefined;

  const token =
    (data?.token as string) ||
    (data?.accessToken as string) ||
    (data?.jwt as string) ||
    (data?.access_token as string) ||
    headerToken;

  if (!res.ok && !token) {
    const errMsg = (data?.message as string) || (data?.error as string) || `HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  const managedAddress =
    (data.walletAddress as string | undefined) ??
    (data.managedWalletAddress as string | undefined) ??
    (data.managedAccountAddress as string | undefined);

  return { token, managedAddress };
}

export async function ensureAuth(): Promise<{
  jwt: string;
  address: string;
} | null> {
  const account = getBurnerAccount();
  if (!account) return null;

  const address = account.address;

  try {
    const { signature, timestamp } = await signBentoMessage(address);

    // Try login first
    try {
      const loginRes = await fetchAuth("/bento/user/auth/eoa/login", {
        address,
        signature,
        timestamp,
      });
      if (loginRes.token) return { jwt: loginRes.token, address: loginRes.managedAddress ?? address };
    } catch (loginErr) {
      // If login fails (user not registered), register
      console.warn("[OnGod] Login failed, trying register:", loginErr);
    }

    // Register — generate a username from address
    const username = `og_${address.slice(2, 10).toLowerCase()}`;
    const { signature: sig2, timestamp: ts2 } = await signBentoMessage(address);

    const registerRes = await fetchAuth("/bento/user/auth/eoa/register", {
      address,
      signature: sig2,
      timestamp: ts2,
      username,
    });

    if (registerRes.token) return { jwt: registerRes.token, address: registerRes.managedAddress ?? address };

    // If no token from register either, try login again (race condition)
    const { signature: sig3, timestamp: ts3 } = await signBentoMessage(address);
    const retryRes = await fetchAuth("/bento/user/auth/eoa/login", {
      address,
      signature: sig3,
      timestamp: ts3,
    });

    if (retryRes.token) return { jwt: retryRes.token, address: retryRes.managedAddress ?? address };
    throw new Error("Could not obtain JWT after register");
  } catch (err) {
    console.error("[OnGod] Auth failed:", err);
    return null;
  }
}

export async function mintTestCredits(jwt: string, address: string) {
  try {
    const res = await fetch(`${BASE_URL}/bento/auto-mint/mint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-builder-api-key": API_KEY,
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ userAddress: address }),
    });
    if (!res.ok) console.warn("[OnGod] autoMint returned", res.status);
  } catch (err) {
    console.warn("[OnGod] autoMint.mint:", err);
  }
}
