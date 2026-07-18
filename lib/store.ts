import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CalloutMeta {
  duelId: string;
  parentMarketId?: string;
  claimText: string;
  deadline: string; // ISO string
  inviteCode: string;
  inviteLink: string;
  openingYesPct: number | null;
}

interface OnGodStore {
  // Auth state
  jwt: string | null;
  walletAddress: string | null;
  authProvider: "bento_link" | null;

  // Active callouts this device created or joined
  myCallouts: CalloutMeta[];

  // Actions
  setAuth: (jwt: string, address: string, provider?: "bento_link") => void;
  addCallout: (callout: CalloutMeta) => void;
  clearAuth: () => void;
}

export const useStore = create<OnGodStore>()(
  persist(
    (set) => ({
      jwt: null,
      walletAddress: null,
      authProvider: null,
      myCallouts: [],

      setAuth: (jwt, walletAddress, authProvider = "bento_link") => set({ jwt, walletAddress, authProvider }),
      addCallout: (callout) =>
        set((s) => ({
          myCallouts: [
            callout,
            ...s.myCallouts.filter((c) => c.duelId !== callout.duelId),
          ],
        })),
      clearAuth: () => set({ jwt: null, walletAddress: null }),
    }),
    {
      name: "ongod-store",
      partialize: (s) => ({
        jwt: s.jwt,
        walletAddress: s.walletAddress,
        myCallouts: s.myCallouts,
      }),
    }
  )
);
