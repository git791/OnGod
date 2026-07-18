"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toBlob } from "html-to-image";
import Receipt, { type ReceiptData } from "@/components/Receipt";
import { bentoPublic } from "@/lib/bento";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

const MotionLink = motion.create(Link);

interface LeaderEntry {
  address: string;
  pnl: number;
}

export default function ReceiptPage() {
  const params = useParams();
  const duelId = params?.duelId as string;
  const { walletAddress, myCallouts } = useStore();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const meta = myCallouts.find((c) => c.duelId === duelId);

  const loadData = useCallback(async () => {
    try {
      // 1. Get duel info via getDuelById
      const res = await bentoPublic.public.duels.getById({ duelId });
      const d = (res as Record<string, unknown>).duel ? ((res as Record<string, unknown>).duel as Record<string, unknown>) : (res as Record<string, unknown>);

      const title = d.question ?? d.title ?? meta?.claimText ?? "Callout";
      const endTime = d.endTime ? new Date(Number(d.endTime) * 1000).toISOString() : new Date().toISOString();
      const status = d.status ?? "open";
      const creator = d.creatorAddress ?? d.creator ?? "";
      const resolvedYes = d.outcome === "yes" || d.winningOption === 0 || d.result === "yes";

      if (status !== "resolved" && status !== "settled") {
        setError("This callout hasn't been resolved yet.");
        setLoading(false);
        return;
      }

      // 2. Get odds snapshots — getYesPercentageSnapshots takes duelId as string
      let openingYesPct = meta?.openingYesPct ?? 50;
      let closingYesPct = 50;
      try {
        const raw = await bentoPublic.public.publicBets.getYesPercentageSnapshots(duelId);
        const snaps = Array.isArray(raw) ? raw : [];
        if (snaps.length > 0) {
          const first = snaps[0] as Record<string, unknown>;
          const last = snaps[snaps.length - 1] as Record<string, unknown>;
          openingYesPct = Number(first.yesPercentage ?? first.yes_percentage ?? 50);
          closingYesPct = Number(last.yesPercentage ?? last.yes_percentage ?? 50);
        }
      } catch {
        // use defaults
      }

      let anakinRoast = null;
      try {
        const roastRes = await fetch("/api/roast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimText: String(title),
            openingOdds: openingYesPct,
            closingOdds: closingYesPct,
            verdict: resolvedYes ? "on_god" : "cap",
          }),
        });
        if (roastRes.ok) {
          const roastData = await roastRes.json();
          if (roastData.line) anakinRoast = roastData.line;
        }
      } catch {
        // fail open
      }

      setReceiptData({
        claimText: String(title),
        caller: String(creator),
        deadline: endTime,
        openingYesPct,
        closingYesPct,
        resolvedYes,
        duelId,
        resolvedAt: new Date().toISOString(),
        anakinRoast,
      });

      // 3. Leaderboard — getTradersPnl
      try {
        // leaderboard.getTradersPnl may take duelId as string
        const lb = await bentoPublic.public.leaderboard.getTradersPnl({ duelId });
        const entries: LeaderEntry[] = Array.isArray(lb)
          ? lb.map((e: Record<string, unknown>) => ({
              address: String(e.address ?? "???"),
              pnl: Number(e.pnl ?? e.totalPnl ?? 0),
            }))
          : [];
        setLeaderboard(entries);
      } catch {
        // non-critical
      }

      setTimeout(() => setShowReceipt(true), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load receipt");
    } finally {
      setLoading(false);
    }
  }, [duelId, meta]);

  useEffect(() => {
    if (duelId) loadData();
  }, [duelId, loadData]);

  async function downloadReceipt() {
    if (!receiptRef.current) return;
    setSharing(true);
    try {
      const blob = await toBlob(receiptRef.current, { pixelRatio: 3 });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ongod-receipt-${duelId.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } finally {
      setSharing(false);
    }
  }

  async function shareReceipt() {
    if (!receiptRef.current) return;
    setSharing(true);
    try {
      const blob = await toBlob(receiptRef.current, { pixelRatio: 3 });
      if (!blob) return;
      const file = new File([blob], `ongod-${duelId.slice(0, 8)}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "OnGod Receipt", text: "My squad called it on OnGod 🔥", files: [file] });
        setShared(true);
      } else {
        await downloadReceipt();
      }
    } finally {
      setSharing(false);
    }
  }

  function shorten(addr: string) {
    if (!addr || addr === "???") return "???";
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }

  if (loading) return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
      <p style={{ fontSize: "40px", marginBottom: "16px" }}>⏳</p>
      <p style={{ color: "var(--ash)", marginBottom: "20px" }}>{error}</p>
      <Link href={`/callout/${duelId}`} className="btn btn-ghost">← Back to callout</Link>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh" }}>
      <nav className="navbar">
        <Link href={`/callout/${duelId}`} className="logo" style={{ textDecoration: "none" }}>
          ← <img src="/logo-wordmark.svg" alt="OnGod" width="100" style={{ marginLeft: "8px" }} />
        </Link>
      </nav>

      <div className="page" style={{ paddingTop: "28px" }}>
        <h1 className="font-display" style={{ fontSize: "28px", marginBottom: "8px", textTransform: "uppercase" }}>🧾 The Receipt</h1>
        <p style={{ color: "var(--ash)", fontSize: "14px", marginBottom: "28px" }}>
          Screenshot this. Post it. Let the receipt do the talking.
        </p>

        {receiptData && (
          <div className={showReceipt ? "receipt-unspool" : ""} style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
            <Receipt ref={receiptRef} data={receiptData} />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          <motion.button 
            className="btn btn-cherry" 
            onClick={shareReceipt} 
            disabled={sharing}
            whileHover={!sharing ? { scale: 0.98, rotate: -1 } : {}}
            whileTap={!sharing ? { scale: 0.95, rotate: -2 } : {}}
          >
            {sharing ? <div className="spinner" style={{ width: "16px", height: "16px" }} /> : shared ? "✅ Shared!" : "📤 Share"}
          </motion.button>
          <motion.button 
            className="btn btn-ghost" 
            onClick={downloadReceipt} 
            disabled={sharing}
            whileHover={!sharing ? { scale: 0.98 } : {}}
            whileTap={!sharing ? { scale: 0.95 } : {}}
          >
            ⬇️ PNG
          </motion.button>
        </div>

        {leaderboard.length > 0 && (
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ash)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "16px" }}>
              Oracle Score
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[...leaderboard].sort((a, b) => b.pnl - a.pnl).slice(0, 10).map((entry, i) => (
                <div key={entry.address} className="card halftone-bg" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "14px" }}>
                  <span className="font-mono" style={{ color: i === 0 ? "var(--cherry-stamp)" : "var(--ash)", fontWeight: 700, width: "20px", position: "relative" }}>#{i + 1}</span>
                  <span className="font-mono" style={{ fontSize: "13px", flex: 1, position: "relative", color: "var(--soot-ink)" }}>
                    {shorten(entry.address)}
                    {entry.address.toLowerCase() === walletAddress?.toLowerCase() && (
                      <span style={{ color: "var(--varsity-teal)", marginLeft: "6px" }}>you</span>
                    )}
                  </span>
                  <span className="font-mono" style={{ fontSize: "13px", fontWeight: 700, position: "relative", color: entry.pnl >= 0 ? "var(--cherry-stamp)" : "var(--marigold-ticket)" }}>
                    {entry.pnl >= 0 ? "+" : ""}{(entry.pnl / 1e18).toFixed(2)} Cr
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <MotionLink 
          href="/" 
          className="btn btn-ghost" 
          style={{ width: "100%", marginTop: "32px" }}
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Home
        </MotionLink>
      </div>
    </div>
  );
}
