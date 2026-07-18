"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { startBentoConnect } from "@/lib/bento-link";
import Countdown from "@/components/Countdown";
import { motion } from "framer-motion";

const MotionLink = motion.create(Link);

export default function Home() {
  const { jwt, walletAddress, authProvider, myCallouts } = useStore();
  const isBentoConnected = Boolean(jwt && authProvider === "bento_link");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connectBento() {
    setLoading(true);
    setError(null);
    try {
      await startBentoConnect("/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not start Bento connection";
      setError(msg);
      setLoading(false);
    } finally {
      // Navigation to Bento normally ends this page; retain the loading state
      // until then so duplicate connection attempts are not possible.
    }
  }

  const shortAddr = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : null;

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Navbar */}
      <nav className="navbar">
        <span className="logo">
          <img src="/logo-wordmark.svg" alt="OnGod" width="110" />
        </span>
        {shortAddr && (
          <span
            className="font-mono text-xs"
            style={{ color: "var(--soot-ink)", background: "rgba(33, 29, 23, 0.08)", padding: "6px 12px", borderRadius: "8px" }}
          >
            {shortAddr}
          </span>
        )}
      </nav>

      <div className="page">
        {/* Hero */}
        <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
          <h1
            className="font-display"
            style={{ fontSize: "clamp(42px,10vw,64px)", lineHeight: 1.05, letterSpacing: "1px", marginBottom: "16px", textTransform: "uppercase" }}
          >
            Turn chat beef into{" "}
            <span style={{ color: "var(--cherry-stamp)" }}>real stakes.</span>
          </h1>
          <p style={{ color: "var(--ash)", fontSize: "17px", lineHeight: 1.6, maxWidth: "320px", margin: "0 auto 32px" }}>
            Call it out. Let the squad vote with money. Collect your receipt.
          </p>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div className="spinner" />
              <span style={{ color: "var(--ash)", fontSize: "13px" }}>
                Opening Bento…
              </span>
            </div>
          ) : error ? (
            <div style={{ color: "var(--cherry-stamp)", fontSize: "14px", marginBottom: "16px" }}>
              <p>{error}</p>
              <button className="btn btn-ghost" style={{ marginTop: "12px" }} onClick={connectBento}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {isBentoConnected ? (
                <MotionLink
                  href="/create"
                  className="btn btn-cherry"
                  style={{ fontSize: "17px", padding: "16px 36px" }}
                  whileHover={{ scale: 0.98, rotate: -1 }}
                  whileTap={{ scale: 0.95, rotate: -2 }}
                >
                  🔥 Call It Out
                </MotionLink>
              ) : (
                <motion.button
                  className="btn btn-cherry"
                  style={{ fontSize: "17px", padding: "16px 36px" }}
                  onClick={connectBento}
                  whileHover={{ scale: 0.98, rotate: -1 }}
                  whileTap={{ scale: 0.95, rotate: -2 }}
                >
                  Connect Bento
                </motion.button>
              )}
            </>
          )}
        </div>

        {/* Stats row */}
        {!loading && !error && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "12px",
              marginBottom: "40px",
            }}
          >
            {[
              { label: "On God", color: "var(--cherry-stamp)", emoji: "✊" },
              { label: "or Cap?", color: "var(--marigold-ticket)", emoji: "🧢" },
              { label: "Settle it", color: "var(--varsity-teal)", emoji: "⚡" },
            ].map((item) => (
              <div
                key={item.label}
                className="card halftone-bg"
                style={{ padding: "16px 12px", textAlign: "center" }}
              >
                <div style={{ fontSize: "24px", marginBottom: "6px", position: "relative" }}>{item.emoji}</div>
                <div style={{ color: item.color, fontWeight: 700, fontSize: "13px", position: "relative" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active callouts list */}
        {myCallouts.length > 0 && (
          <div>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ash)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "16px" }}>
              Your callouts
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {myCallouts.map((c) => (
                <MotionLink
                  key={c.duelId}
                  href={`/callout/${c.duelId}`}
                  style={{ textDecoration: "none" }}
                  whileHover={{ scale: 0.99 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div
                    className="card"
                    style={{
                      padding: "16px",
                      transition: "border-color 150ms ease",
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px", lineHeight: 1.35, color: "var(--soot-ink)" }}>
                      {c.claimText}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Countdown deadline={c.deadline} />
                      <span style={{ fontSize: "12px", color: "var(--varsity-teal)", fontWeight: 700 }}>
                        View →
                      </span>
                    </div>
                  </div>
                </MotionLink>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        {!loading && myCallouts.length === 0 && (
          <div style={{ marginTop: "8px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: "var(--ash)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "16px" }}>
              How it works
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { step: "01", text: "Type a claim your squad is beefing over", color: "var(--varsity-teal)" },
                { step: "02", text: "Share the invite link — squad taps On God or Cap", color: "var(--cherry-stamp)" },
                { step: "03", text: "Watch odds move live as stakes pour in", color: "var(--marigold-ticket)" },
                { step: "04", text: "Resolve it & everyone gets a shareable receipt", color: "var(--soot-ink)" },
              ].map((item) => (
                <div key={item.step} className="card halftone-bg" style={{ padding: "14px 16px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span className="font-mono" style={{ color: item.color, fontWeight: 700, fontSize: "13px", flexShrink: 0, position: "relative" }}>
                    {item.step}
                  </span>
                  <span style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--soot-ink)", position: "relative" }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
