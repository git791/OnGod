"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getBentoPublic, createAuthedSdk } from "@/lib/bento";
import OddsBar from "@/components/OddsBar";
import Countdown from "@/components/Countdown";
import { motion } from "framer-motion";

const MotionLink = motion.create(Link);

interface DuelInfo {
  title: string;
  endTime: string; // ISO string
  status: string;
  creatorAddress?: string;
}

const POLL_MS = 2500;
// 1 credit in wei (18 decimals)
const STAKE_WEI = "1000000000000000000";

export default function CalloutPage() {
  const params = useParams();
  const duelId = params?.duelId as string;
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite") ?? undefined;
  const { jwt, walletAddress, myCallouts } = useStore();

  const [duel, setDuel] = useState<DuelInfo | null>(null);
  const [yesPct, setYesPct] = useState(50);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Bet flow state
  // optionIndex: 0 = YES (On God), 1 = NO (Cap)
  const [betSide, setBetSide] = useState<0 | 1 | null>(null);
  const [estimateData, setEstimateData] = useState<{
    currentYesPrice: number;
    currentNoPrice: number;
    newYesPrice: number;
    minSharesOut: number;
    sharesOut: number;
  } | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [betSuccess, setBetSuccess] = useState(false);

  // Resolve
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Anakin Suggestion
  const [evidence, setEvidence] = useState("");
  const [anakinSuggestion, setAnakinSuggestion] = useState<{ suggestedVerdict: "on_god" | "cap" | null, justification: string | null } | null>(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);

  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const meta = myCallouts.find((c) => c.duelId === duelId);
  const isCreator = !!(walletAddress && duel?.creatorAddress &&
    duel.creatorAddress.toLowerCase() === walletAddress.toLowerCase());
  const isResolved = duel?.status === "resolved" || duel?.status === "settled";
  const isClosed = isResolved || (duel?.endTime ? Date.now() > new Date(duel.endTime).getTime() : false);

  // Load duel
  const loadDuel = useCallback(async () => {
    try {
      const res = await getBentoPublic().public.duels.getById({ duelId, inviteCode });
      const d = (res as Record<string, unknown>).duel ?? res;
      const dr = d as Record<string, unknown>;
      const closesRaw = dr.endTime ?? dr.closesAt;
      setDuel({
        title: String(dr.question ?? dr.title ?? meta?.claimText ?? "Callout"),
        endTime: closesRaw ? new Date(Number(closesRaw) * 1000).toISOString() : "",
        status: String(dr.status ?? "open"),
        creatorAddress: String(dr.creatorAddress ?? dr.creator ?? ""),
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load callout");
    }
  }, [duelId, meta]);

  // Poll odds
  const pollOdds = useCallback(async () => {
    try {
      // getYesPercentageSnapshots takes duelId as plain string
      const raw = await getBentoPublic().public.publicBets.getYesPercentageSnapshots(duelId);
      // raw is JsonRecord — handle as array or object
      const snaps = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).snapshots ?? [];
      if (Array.isArray(snaps) && snaps.length > 0) {
        const last = snaps[snaps.length - 1] as Record<string, unknown>;
        const pct = (last?.yesPercentage ?? last?.yes_percentage ?? last?.yesPct ?? 50) as number;
        setYesPct(pct);
      }
    } catch {
      // silently ignore
    }
  }, [duelId]);

  useEffect(() => {
    if (!duelId) return;
    setLoading(true);
    Promise.all([loadDuel(), pollOdds()]).finally(() => setLoading(false));
    pollRef.current = setInterval(pollOdds, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [duelId, loadDuel, pollOdds]);

  // Fetch Suggestion
  const fetchSuggestion = useCallback(async (currentEvidence: string = "") => {
    if (!duel?.title) return; // Need claim text
    try {
      let fetchedMarkdown = null;
      let fetchedJson = null;

      // If it looks like a URL, fetch it first
      if (currentEvidence.trim().startsWith("http")) {
        const fetchRes = await fetch("/api/evidence/fetch-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentEvidence.trim() })
        });
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          fetchedMarkdown = data.markdown;
          fetchedJson = data.generatedJson;
        }
      }

      const res = await fetch("/api/resolve-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimText: duel.title,
          deadline: duel.endTime,
          evidence: currentEvidence,
          fetchedMarkdown,
          fetchedJson
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestedVerdict) {
          setAnakinSuggestion(data);
          setDismissedSuggestion(false);
        }
      }
    } catch {
      // Fail open
    }
  }, [duel?.title, duel?.endTime]);

  // Initial fetch when duel loads and is unresolved
  useEffect(() => {
    if (isCreator && !isResolved && duel?.title && !anakinSuggestion && !dismissedSuggestion) {
      fetchSuggestion("");
    }
  }, [isCreator, isResolved, duel?.title, fetchSuggestion, anakinSuggestion, dismissedSuggestion]);

  // Estimate when side selected
  useEffect(() => {
    if (betSide === null || !jwt) return;
    setEstimating(true);
    setEstimateData(null);

    const sdk = createAuthedSdk(jwt);
    sdk.user.estimateBuy({
      duelId,
      optionIndex: betSide,
      betAmountUsdc: STAKE_WEI,
    })
      .then((res: unknown) => {
        const r = res as Record<string, unknown>;
        if (r.success && r.estimate) {
          const est = r.estimate as Record<string, number>;
          setEstimateData({
            currentYesPrice: est.current_yes_price ?? 0.5,
            currentNoPrice: est.current_no_price ?? 0.5,
            newYesPrice: est.new_yes_price ?? 0.5,
            minSharesOut: est.min_shares_out ?? 0,
            sharesOut: est.min_shares_out ?? 0,
          });
        }
      })
      .catch(() => setEstimateData(null))
      .finally(() => setEstimating(false));
  }, [betSide, duelId, jwt]);

  async function placeBet() {
    if (!jwt || betSide === null) return;
    setPlacing(true);
    setBetError(null);

    try {
      const sdk = createAuthedSdk(jwt);
      await sdk.user.placeBet({
        duelId,
        duelType: "prediction",
        bet: betSide === 0 ? "yes" : "no",
        optionIndex: betSide,
        betAmount: STAKE_WEI,
        betAmountUsdc: STAKE_WEI,
        sharesOut: estimateData?.sharesOut ?? 0,
        minSharesOut: estimateData?.minSharesOut ?? 0,
        slippageBps: 100, // 1% slippage
      });
      setBetSuccess(true);
      setBetSide(null);
      setEstimateData(null);
      await pollOdds();
    } catch (e: unknown) {
      setBetError(e instanceof Error ? e.message : "Bet failed");
    } finally {
      setPlacing(false);
    }
  }

  async function resolveCallout(outcome: "yes" | "no") {
    if (!jwt) return;
    setResolving(true);
    setResolveError(null);

    try {
      // Resolve via direct API call
      const BASE = process.env.NEXT_PUBLIC_BENTO_BASE_URL ?? "https://markets.bento.fun";
      await fetch(`${BASE}/bento/user/duels/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-builder-api-key": process.env.NEXT_PUBLIC_BENTO_BUILDER_KEY ?? "",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ duelId, outcome }),
      });

      await loadDuel();
      window.location.href = `/receipt/${duelId}`;
    } catch (e: unknown) {
      setResolveError(e instanceof Error ? e.message : "Resolve failed");
    } finally {
      setResolving(false);
    }
  }

  async function copyInvite() {
    if (!meta?.inviteLink) return;
    await navigator.clipboard.writeText(meta.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" />
    </div>
  );

  if (loadError) return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
      <p style={{ color: "var(--cherry-stamp)", marginBottom: "16px" }}>{loadError}</p>
      <Link href="/" className="btn btn-ghost">← Home</Link>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh" }}>
      <nav className="navbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>
          ← <img src="/logo-wordmark.svg" alt="OnGod" width="100" style={{ marginLeft: "8px" }} />
        </Link>
        {meta?.inviteLink && !isResolved && (
          <button className="btn btn-ghost" style={{ fontSize: "13px", padding: "8px 16px" }} onClick={copyInvite}>
            {copied ? "✅ Copied" : "📋 Invite"}
          </button>
        )}
      </nav>

      <div className="page" style={{ paddingTop: "28px" }}>
        {/* Callout card */}
        <div className="card halftone-bg" style={{ padding: "24px", marginBottom: "20px" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(24px,5vw,32px)", lineHeight: 1.1, marginBottom: "16px", letterSpacing: "0.5px", textTransform: "uppercase", position: "relative" }}>
            {duel?.title}
          </h1>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px", position: "relative" }}>
            {duel?.endTime && <Countdown deadline={duel.endTime} />}
            {isResolved && (
              <span style={{ background: "rgba(200, 16, 46, 0.15)", color: "var(--cherry-stamp)", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px", letterSpacing: "1px" }}>
                RESOLVED
              </span>
            )}
          </div>
          <OddsBar yesPct={yesPct} />
          {betSuccess && (
            <div style={{ marginTop: "16px", background: "rgba(31, 111, 92, 0.1)", border: "1px dashed var(--varsity-teal)", borderRadius: "10px", padding: "10px 14px", color: "var(--varsity-teal)", fontSize: "14px", fontWeight: 600 }}>
              ✅ Bet placed! Odds updating…
            </div>
          )}
        </div>

        {/* Bet UI */}
        {!isResolved && !isClosed && jwt && (
          betSide === null ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <motion.button
                className="btn btn-cherry"
                style={{ flexDirection: "column", padding: "20px 12px", gap: "4px" }}
                onClick={() => { setBetSide(0); setBetSuccess(false); setBetError(null); }}
                whileHover={{ scale: 0.98, rotate: -1 }}
                whileTap={{ scale: 0.95, rotate: -2 }}
              >
                <img src="/icon-on-god.svg" alt="On God" width="48" style={{ marginBottom: "8px" }} />
                <span style={{ fontSize: "17px", fontWeight: 800 }}>ON GOD</span>
                <span style={{ fontSize: "11px", opacity: 0.9 }}>Yes, it happens</span>
              </motion.button>
              <motion.button
                className="btn btn-marigold"
                style={{ flexDirection: "column", padding: "20px 12px", gap: "4px" }}
                onClick={() => { setBetSide(1); setBetSuccess(false); setBetError(null); }}
                whileHover={{ scale: 0.98, rotate: 1 }}
                whileTap={{ scale: 0.95, rotate: 2 }}
              >
                <img src="/icon-cap.svg" alt="Cap" width="48" style={{ marginBottom: "8px" }} />
                <span style={{ fontSize: "17px", fontWeight: 800 }}>CAP</span>
                <span style={{ fontSize: "11px", opacity: 0.9 }}>Nah, won't happen</span>
              </motion.button>
            </div>
          ) : (
            <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
              <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>
                Staking 1 Credit on{" "}
                <span style={{ color: betSide === 0 ? "var(--cherry-stamp)" : "var(--marigold-ticket)" }}>
                  {betSide === 0 ? "ON GOD ✊" : "CAP 🧢"}
                </span>
              </p>
              {estimating ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "var(--ash)", fontSize: "14px", margin: "12px 0" }}>
                  <div className="spinner" style={{ width: "16px", height: "16px" }} /> Getting quote…
                </div>
              ) : estimateData ? (
                <div className="font-mono" style={{ fontSize: "12px", color: "var(--ash)", margin: "12px 0" }}>
                  <p>Current price: <span style={{ color: "var(--soot-ink)" }}>{betSide === 0 ? (estimateData.currentYesPrice * 100).toFixed(1) : ((1 - estimateData.currentYesPrice) * 100).toFixed(1)}¢</span></p>
                  <p>Estimated shares: <span style={{ color: "var(--varsity-teal)" }}>{estimateData.sharesOut.toFixed(2)}</span></p>
                </div>
              ) : null}
              {betError && <p style={{ color: "var(--cherry-stamp)", fontSize: "13px", marginBottom: "10px" }}>{betError}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button className="btn btn-ghost" onClick={() => { setBetSide(null); setEstimateData(null); }}>Cancel</button>
                <motion.button
                  className={betSide === 0 ? "btn btn-cherry" : "btn btn-marigold"}
                  disabled={placing}
                  onClick={placeBet}
                  whileHover={!placing ? { scale: 0.98 } : {}}
                  whileTap={!placing ? { scale: 0.95 } : {}}
                >
                  {placing ? <div className="spinner" style={{ width: "16px", height: "16px" }} /> : "Confirm Bet"}
                </motion.button>
              </div>
            </div>
          )
        )}

        {/* Resolve — creator only */}
        {isCreator && !isResolved && (
          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px", color: "var(--soot-ink)" }}>🏁 Resolve this callout</p>
            <p style={{ color: "var(--ash)", fontSize: "13px", marginBottom: "16px" }}>You created this. Mark the outcome when it's settled IRL.</p>
            
            {/* Anakin UI */}
            <div style={{ marginBottom: "16px" }}>
              <input 
                type="text" 
                placeholder="Optional: Add evidence (e.g. 'He was 5 mins late')"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                onBlur={() => fetchSuggestion(evidence)}
                className="input"
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: "6px",
                  fontSize: "13px", marginBottom: "8px"
                }}
              />
              {anakinSuggestion && !dismissedSuggestion && (
                <div style={{ 
                  background: "rgba(31, 111, 92, 0.1)", border: "1.5px dashed var(--varsity-teal)", 
                  borderRadius: "6px", padding: "10px", display: "flex", gap: "10px", 
                  alignItems: "flex-start", marginBottom: "8px", position: "relative"
                }}>
                  <span style={{ fontSize: "16px" }}>🤖</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--varsity-teal)", marginBottom: "2px" }}>
                      Anakin thinks: {anakinSuggestion.suggestedVerdict === "on_god" ? "On God ✊" : "Cap 🧢"}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--soot-ink)" }}>{anakinSuggestion.justification}</p>
                  </div>
                  <button 
                    onClick={() => setDismissedSuggestion(true)}
                    style={{ background: "none", border: "none", color: "var(--ash)", cursor: "pointer", padding: "0 4px" }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {resolveError && <p style={{ color: "var(--cherry-stamp)", fontSize: "13px", marginBottom: "10px" }}>{resolveError}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <motion.button 
                className="btn btn-cherry" 
                disabled={resolving} 
                onClick={() => resolveCallout("yes")}
                style={anakinSuggestion?.suggestedVerdict === "on_god" && !dismissedSuggestion ? { boxShadow: "0 0 0 2px var(--soot-ink)" } : {}}
                whileTap={{ scale: 1, animation: "stamp 120ms cubic-bezier(0,0,0.2,1) forwards" }}
              >
                {resolving ? <div className="spinner" style={{ width: "16px", height: "16px" }} /> : "✊ On God"}
              </motion.button>
              <motion.button 
                className="btn btn-marigold" 
                disabled={resolving} 
                onClick={() => resolveCallout("no")}
                style={anakinSuggestion?.suggestedVerdict === "cap" && !dismissedSuggestion ? { boxShadow: "0 0 0 2px var(--soot-ink)" } : {}}
                whileTap={{ scale: 1, animation: "stamp 120ms cubic-bezier(0,0,0.2,1) forwards" }}
              >
                {resolving ? <div className="spinner" style={{ width: "16px", height: "16px" }} /> : "🧢 Cap"}
              </motion.button>
            </div>
          </div>
        )}

        {isResolved && (
          <MotionLink 
            href={`/receipt/${duelId}`} 
            className="btn btn-cherry" 
            style={{ width: "100%", marginBottom: "16px" }}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
          >
            🧾 View Receipt
          </MotionLink>
        )}

        {!jwt && (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--ash)" }}>
            <p>You need to onboard first.</p>
            <Link href="/" className="btn btn-cherry" style={{ marginTop: "12px" }}>Go to Home</Link>
          </div>
        )}
      </div>
    </div>
  );
}
