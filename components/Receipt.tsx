"use client";

/**
 * Receipt component — styled as a thermal paper receipt.
 * Rendered off-screen and captured by html-to-image as PNG.
 * Also shown on-screen after resolution.
 */

import { forwardRef } from "react";

export interface ReceiptData {
  claimText: string;
  caller: string; // wallet address (shortened)
  deadline: string; // ISO
  openingYesPct: number;
  closingYesPct: number;
  resolvedYes: boolean; // true = "On God" won
  duelId: string;
  resolvedAt: string; // ISO
  anakinRoast?: string | null;
}

function shorten(addr: string) {
  if (!addr) return "???";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const Receipt = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  ({ data }, ref) => {
    const verdict = data.resolvedYes ? "CALLED IT" : "CAPPED OUT";
    const verdictColor = data.resolvedYes ? "#C8102E" : "#FDB913"; // Cherry Stamp or Marigold Ticket

    return (
      <div
        ref={ref}
        style={{
          background: "#EBE5D9", // Ticket Cream
          color: "#211D17", // Soot Ink
          fontFamily: '"Courier Prime", monospace',
          width: "360px",
          padding: "32px 24px",
          borderRadius: "4px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Perforated top edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            backgroundImage:
              "radial-gradient(circle, #EBE5D9 3px, rgba(33,29,23,0.1) 3px)",
            backgroundSize: "16px 8px",
          }}
        />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px", marginTop: "8px" }}>
          <div style={{ fontSize: "28px", fontFamily: '"Anton", sans-serif', textTransform: "uppercase", letterSpacing: "2px" }}>
            ON GOD
          </div>
          <div style={{ fontSize: "11px", letterSpacing: "1px", marginTop: "4px", color: "rgba(33, 29, 23, 0.7)", fontWeight: 700 }}>
            SQUAD BET RECEIPT
          </div>
        </div>

        <Dashes />

        {/* Claim */}
        <div style={{ fontSize: "14px", fontWeight: 700, margin: "16px 0 4px", lineHeight: 1.4 }}>
          {data.claimText}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(33, 29, 23, 0.7)", marginBottom: "16px" }}>
          Caller: {shorten(data.caller)}
        </div>

        <Dashes />

        {/* Odds table */}
        <div style={{ margin: "16px 0", fontSize: "11px" }}>
          <Row label="OPENING ODDS" value={`ON GOD ${Math.round(data.openingYesPct)}% / CAP ${Math.round(100 - data.openingYesPct)}%`} />
          <Row label="CLOSING ODDS" value={`ON GOD ${Math.round(data.closingYesPct)}% / CAP ${Math.round(100 - data.closingYesPct)}%`} />
          <Row label="SETTLED" value={fmt(data.resolvedAt)} />
          <Row label="MARKET ID" value={`#${data.duelId.slice(0, 8)}`} />
        </div>

        <Dashes />

        {/* Verdict stamp */}
        <div
          style={{
            textAlign: "center",
            margin: "24px 0 16px",
            border: `3px solid ${verdictColor}`,
            borderRadius: "4px",
            padding: "10px 0",
            transform: "rotate(-2deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "56px",
          }}
        >
          {data.anakinRoast ? (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: verdictColor,
                textTransform: "uppercase",
                padding: "0 12px",
                lineHeight: 1.3,
                fontFamily: '"Permanent Marker", cursive',
              }}
            >
              {data.anakinRoast}
            </div>
          ) : (
            <div
              style={{
                fontSize: "28px",
                fontWeight: 400,
                color: verdictColor,
                fontFamily: '"Permanent Marker", cursive',
              }}
            >
              {verdict}
            </div>
          )}
        </div>

        <Dashes />

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: "10px", color: "rgba(33, 29, 23, 0.6)", marginTop: "16px", fontWeight: 700 }}>
          <div>bento.fun · on-chain settlement</div>
          <div style={{ marginTop: "4px" }}>THANK YOU FOR PLAYING</div>
        </div>

        {/* Perforated bottom edge */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "8px",
            backgroundImage:
              "radial-gradient(circle, #EBE5D9 3px, rgba(33, 29, 23, 0.1) 3px)",
            backgroundSize: "16px 8px",
          }}
        />
      </div>
    );
  }
);

Receipt.displayName = "Receipt";
export default Receipt;

function Dashes() {
  return (
    <div
      style={{
        borderTop: "1.5px dashed rgba(33, 29, 23, 0.2)",
        margin: "6px 0",
      }}
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "6px",
        gap: "8px",
      }}
    >
      <span style={{ color: "rgba(33, 29, 23, 0.8)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: "right", color: "#211D17" }}>{value}</span>
    </div>
  );
}
