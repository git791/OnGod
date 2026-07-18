"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { getBentoPublic, createAuthedSdk } from "@/lib/bento";
import { startBentoConnect } from "@/lib/bento-link";

export default function JoinPage() {
  const params = useParams();
  const code = params?.code as string;
  const searchParams = useSearchParams();
  const duelId = searchParams.get("duelId");
  const router = useRouter();

  const { jwt, walletAddress, setAuth } = useStore();
  const [status, setStatus] = useState<"booting" | "joining" | "done" | "error">("booting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function joinFlow() {
      try {
        let activeJwt = jwt;
        let activeAddr = walletAddress;

        if (!activeJwt) {
          setStatus("booting");
          await startBentoConnect(`/join/${code}?duelId=${encodeURIComponent(duelId ?? "")}`);
          return;
        }

        // Validate invite
        setStatus("joining");
        const sdk = createAuthedSdk(activeJwt!);

        if (!duelId) throw new Error("This invite link is missing its callout.");
        await sdk.user.duelInvitations.userJoin({ inviteCode: code });
        setStatus("done");
        router.push(`/callout/${duelId}?invite=${encodeURIComponent(code)}`);
        return;

        // Join via invite code — joinParentMarket takes { inviteCode }
        const joinResult = await sdk.user.joinParentMarket({ inviteCode: code });
        const jRaw = (joinResult as unknown as Record<string, unknown>).raw as Record<string, unknown> | undefined;
        const parentMarketId = (jRaw?.parentMarketId ?? (joinResult as unknown as Record<string, unknown>).parentMarketId) as string | undefined;

        // Get the parent market to find the child duel
        let parentDuelId: string | undefined;
        if (parentMarketId) {
          try {
            const pod = await getBentoPublic().public.parentMarkets.getById(
              parentMarketId!,
              { inviteCode: code }
            );
            // Response is Record<string, unknown> — extract duelIds
            const ids = (pod as Record<string, unknown>).duelIds as string[] | undefined;
            parentDuelId = ids?.[0];
          } catch {
            // fall through
          }
        }

        setStatus("done");
        if (parentDuelId) {
          router.push(`/callout/${parentDuelId}`);
        } else {
          router.push("/");
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes("already")) {
          router.push("/");
          return;
        }
        setError(msg);
        setStatus("error");
      }
    }

    if (code) joinFlow();
  }, [code, duelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusText: Record<string, string> = {
    booting: "Setting up your wallet…",
    joining: "Joining the squad…",
    done: "Joined! Redirecting…",
    error: "Something went wrong.",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--ink)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
      <div style={{ fontSize: "52px", marginBottom: "20px" }}>
        {status === "error" ? "💀" : "🔥"}
      </div>
      <p className="font-display" style={{ fontSize: "24px", marginBottom: "12px" }}>
        {status === "error" ? "Couldn't join" : "Joining the squad"}
      </p>
      <p style={{ color: "var(--smoke)", fontSize: "15px", marginBottom: "24px" }}>
        {statusText[status]}
      </p>
      {status !== "error" && <div className="spinner" />}
      {error && (
        <div style={{ background: "rgba(255,46,126,0.12)", border: "1px solid var(--pink)", borderRadius: "12px", padding: "12px 20px", color: "var(--pink)", fontSize: "14px", maxWidth: "320px" }}>
          {error}
        </div>
      )}
    </div>
  );
}
