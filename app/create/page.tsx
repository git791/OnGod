"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { createAuthedSdk } from "@/lib/bento";
import { mintTestCredits } from "@/lib/auth";
import { motion } from "framer-motion";

const MotionLink = motion.create(Link);

function formatBentoError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  const sdkError = (error as Error & {
    sdkError?: { details?: unknown; fieldErrors?: Record<string, string[]> };
  }).sdkError;
  const details = sdkError?.details ?? sdkError?.fieldErrors;

  if (details && typeof details === "object") {
    const detailText = JSON.stringify(details);
    if (detailText !== "{}") return `${error.message}: ${detailText}`;
  }

  return error.message;
}

export default function CreateCallout() {
  const router = useRouter();
  const { jwt, walletAddress, authProvider, addCallout } = useStore();

  const [claim, setClaim] = useState("I bet that ");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    inviteLink: string;
    duelId: string;
    inviteCode: string;
  } | null>(null);
  const [demoFallback, setDemoFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  const minDeadline = new Date(Date.now() + 35 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  async function handleCreate() {
    if (!jwt || !walletAddress || authProvider !== "bento_link") {
      setError("Connect your Bento account from the home page first.");
      return;
    }
    if (!claim.trim() || claim.trim() === "I bet that") {
      setError("Please fill in your claim.");
      return;
    }
    if (!deadline) {
      setError("Please set a deadline.");
      return;
    }

    const nowMs = Date.now();
    const selectedMs = new Date(deadline).getTime();
    if (selectedMs < nowMs + 32 * 60 * 1000) {
      setError("Deadline must be at least 35 minutes from now (Bento network requirement).");
      return;
    }

    setLoading(true);
    setError(null);
    setDemoFallback(false);

    try {
      await mintTestCredits(jwt, walletAddress);
      const sdk = createAuthedSdk(jwt);
      // Private pods skip public-market bootstrapping. Bento requires a short
      // on-chain lead time; eight minutes also leaves enough room before a
      // user-selected deadline for the child duel to be valid.
      const startTime = new Date(Date.now() + 8 * 60 * 1000).toISOString();
      const endTime = new Date(deadline).toISOString();

      /**
       * Strategy: Use createParentMarket with markets[] to bundle
       * the pod creation + duel creation in one API call.
       */
      const duelResult = await sdk.user.createDuel(
        {
          question: claim,
          type: "prediction" as const,
          category: "Football",
          optionA: "Yes",
          optionB: "No",
          startTime: startTime,
          endTime,
          privacyAccess: "private",
          collateralMode: "credits" as const,
        },
        { requestId: `duel-${Date.now()}` }
      );

      // Response is MutationAccepted — raw is CreateParentMarketResponseDto
      const raw = duelResult.raw as typeof duelResult.raw & {
        inviteCode?: string;
        walletAddress?: string;
      };
      const duelId = raw.duelId;
      let inviteCode = raw.inviteCode;
      if (!duelId) throw new Error("No duelId returned");

      if (!inviteCode) {
        if (!raw.walletAddress) throw new Error("No managed wallet returned for the invite");
        inviteCode = Math.random().toString(36).slice(2, 12).toUpperCase();
        await sdk.user.duelInvitations.create({
          duelId,
          inviteCode,
          inviterAddress: raw.walletAddress,
          expiresAt: 0,
          maxUses: 0,
        });
      }

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const inviteLink = `${baseUrl}/join/${inviteCode}?duelId=${encodeURIComponent(duelId)}`;

      addCallout({
        duelId,
        claimText: claim,
        deadline,
        inviteCode,
        inviteLink,
        openingYesPct: 50,
      });

      setResult({ inviteLink, duelId, inviteCode });
    } catch (e: unknown) {
      console.error("[OnGod] Bento callout creation failed", e);
      // Keep the demo usable when Bento testnet creation is unavailable.
      const duelId = `demo-${Date.now()}`;
      const inviteCode = `DEMO${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const inviteLink = `${baseUrl}/callout/${duelId}`;
      addCallout({
        duelId,
        claimText: claim,
        deadline,
        inviteCode,
        inviteLink,
        openingYesPct: 50,
      });
      setResult({ duelId, inviteCode, inviteLink });
      setDemoFallback(true);
      setError(`Bento Error: ${formatBentoError(e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div style={{ minHeight: "100dvh" }}>
        <nav className="navbar">
          <Link href="/" className="logo" style={{ textDecoration: "none" }}>
            <img src="/logo-wordmark.svg" alt="OnGod" width="110" />
          </Link>
        </nav>
        <div className="page" style={{ paddingTop: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔥</div>
          <h1 className="font-display" style={{ fontSize: "32px", marginBottom: "12px", textTransform: "uppercase" }}>Callout dropped!</h1>
          <p style={{ color: "var(--ash)", marginBottom: "32px", fontSize: "15px" }}>
            Send this link to your squad. They land straight on the bet card.
          </p>
          {demoFallback && (
            <p style={{ color: "var(--marigold-ticket)", fontSize: "13px", marginBottom: "16px" }}>
              Demo mode — Bento testnet creation is unavailable, so this callout is local only.
            </p>
          )}
          <div className="card halftone-bg" style={{ padding: "16px", marginBottom: "20px", wordBreak: "break-all" }}>
            <p className="font-mono" style={{ fontSize: "13px", color: "var(--varsity-teal)", marginBottom: "12px", position: "relative" }}>
              {result.inviteLink}
            </p>
            <motion.button 
              className="btn btn-cherry" 
              style={{ width: "100%" }} 
              onClick={copyLink}
              whileHover={{ scale: 0.98, rotate: -1 }}
              whileTap={{ scale: 0.95, rotate: -2 }}
            >
              {copied ? "✅ Copied!" : "📋 Copy Invite Link"}
            </motion.button>
          </div>
          <MotionLink 
            href={`/callout/${result.duelId}?invite=${encodeURIComponent(result.inviteCode)}`} 
            className="btn btn-ghost" 
            style={{ width: "100%" }}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
          >
            Watch live odds →
          </MotionLink>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      <nav className="navbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>
          ← <img src="/logo-wordmark.svg" alt="OnGod" width="100" style={{ marginLeft: "8px" }} />
        </Link>
      </nav>
      <div className="page" style={{ paddingTop: "32px" }}>
        <h1 className="font-display" style={{ fontSize: "28px", marginBottom: "8px", textTransform: "uppercase" }}>Call it out</h1>
        <p style={{ color: "var(--ash)", fontSize: "14px", marginBottom: "32px" }}>
          Fill in the blank. Set a deadline. Share the link.
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ash)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
            The Claim
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="I bet that Rahul shows up before midnight…"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            maxLength={200}
            style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
          />
          <p style={{ color: "var(--ash)", fontSize: "12px", marginTop: "6px" }}>
            {claim.length}/200
          </p>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ash)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
            Deadline
          </label>
          <input
            type="datetime-local"
            className="input"
            min={minDeadline}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{ colorScheme: "light" }}
          />
        </div>

        {error && (
          <div style={{ background: "rgba(200, 16, 46, 0.12)", border: "1px solid var(--cherry-stamp)", borderRadius: "12px", padding: "12px 16px", color: "var(--cherry-stamp)", fontSize: "14px", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <motion.button
          className="btn btn-cherry"
          style={{ width: "100%", fontSize: "17px", padding: "18px" }}
          disabled={loading || authProvider !== "bento_link"}
          onClick={handleCreate}
          whileHover={!loading && authProvider === "bento_link" ? { scale: 0.98, rotate: -1 } : {}}
          whileTap={!loading && jwt ? { scale: 0.95, rotate: -2 } : {}}
        >
          {loading ? (
            <><div className="spinner" /> Creating callout…</>
          ) : "🔥 Drop the Callout"}
        </motion.button>

        {authProvider !== "bento_link" && (
          <p style={{ color: "var(--ash)", fontSize: "13px", textAlign: "center", marginTop: "12px" }}>
            Go back to home to finish onboarding first.
          </p>
        )}
      </div>
    </div>
  );
}
