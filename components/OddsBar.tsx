"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface OddsBarProps {
  yesPct: number; // 0-100
  animated?: boolean;
}

export default function OddsBar({ yesPct, animated = true }: OddsBarProps) {
  const noPct = 100 - yesPct;
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current || !animated) return;
    barRef.current.classList.add("odds-flash");
    const t = setTimeout(
      () => barRef.current?.classList.remove("odds-flash"),
      400
    );
    return () => clearTimeout(t);
  }, [yesPct, animated]);

  return (
    <div className="w-full">
      {/* Labels */}
      <div className="flex justify-between mb-2 text-xs font-mono font-semibold tracking-widest uppercase">
        <span style={{ color: "var(--cherry-stamp)" }}>ON GOD</span>
        <span style={{ color: "var(--marigold-ticket)" }}>CAP</span>
      </div>

      {/* Bar track */}
      <div
        ref={barRef}
        className="relative h-4 rounded-sm overflow-hidden"
        style={{ background: "var(--ash)" }}
      >
        {/* Cherry (YES / On God) side */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-l-sm"
          animate={{ width: `${yesPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          style={{
            background: "var(--cherry-stamp)",
          }}
        />
        {/* Marigold (NO / Cap) side */}
        <motion.div
          className="absolute right-0 top-0 h-full rounded-r-sm"
          animate={{ width: `${noPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          style={{
            background: "var(--marigold-ticket)",
          }}
        />
        {/* Centre gap / divider */}
        {yesPct > 5 && noPct > 5 && (
          <motion.div
            className="absolute top-0 h-full w-[2px]"
            animate={{ left: `${yesPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            style={{
              background: "var(--ticket-cream)",
              transform: "translateX(-50%)",
            }}
          />
        )}
      </div>

      {/* Percentage labels */}
      <div className="flex justify-between mt-1.5 font-mono text-sm font-bold">
        <span style={{ color: "var(--cherry-stamp)" }}>{Math.round(yesPct)}%</span>
        <span style={{ color: "var(--marigold-ticket)" }}>{Math.round(noPct)}%</span>
      </div>
    </div>
  );
}
