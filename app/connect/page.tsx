"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBentoPublic } from "@/lib/bento";
import { consumeBentoConnectState } from "@/lib/bento-link";
import { useStore } from "@/lib/store";

export default function BentoConnectCallback() {
  const router = useRouter();
  const setAuth = useStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function finishConnect() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const next = params.get("next") || "/";

      if (!code || !consumeBentoConnectState(state)) {
        setError("Bento connection could not be verified. Please try again.");
        return;
      }

      try {
        const session = await getBentoPublic().public.externalLink.exchange({ code });
        setAuth(session.token, session.address);
        router.replace(next.startsWith("/") ? next : "/");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not finish Bento connection.");
      }
    }

    finishConnect();
  }, [router, setAuth]);

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "24px", textAlign: "center" }}>
      {error ? (
        <div>
          <p style={{ color: "var(--cherry-stamp)", marginBottom: "16px" }}>{error}</p>
          <button className="btn btn-ghost" onClick={() => router.replace("/")}>Back home</button>
        </div>
      ) : (
        <div style={{ display: "grid", justifyItems: "center", gap: "14px" }}>
          <div className="spinner" />
          <p style={{ color: "var(--ash)" }}>Connecting your Bento account…</p>
        </div>
      )}
    </main>
  );
}
