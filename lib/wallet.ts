import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const STORAGE_KEY = "ongod_burner_pk";

export function getBurnerAccount() {
  if (typeof window === "undefined") return null;

  let pk = localStorage.getItem(STORAGE_KEY) as `0x${string}` | null;

  if (!pk) {
    pk = generatePrivateKey();
    localStorage.setItem(STORAGE_KEY, pk);
  }

  return privateKeyToAccount(pk);
}

export function getBurnerPrivateKey(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY) as `0x${string}` | null;
}

export function clearBurnerWallet() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
