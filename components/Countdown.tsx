"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";

interface CountdownProps {
  deadline: string; // ISO date string
  className?: string;
}

export default function Countdown({ deadline, className = "" }: CountdownProps) {
  const [label, setLabel] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function tick() {
      const target = new Date(deadline);
      const now = new Date();
      if (target <= now) {
        setLabel("CLOSED");
        setExpired(true);
        return;
      }
      setLabel(`closes in ${formatDistanceToNowStrict(target)}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <span
      className={`font-mono text-xs tracking-wider uppercase ${className}`}
      style={{ color: expired ? "var(--pink)" : "var(--smoke)" }}
    >
      {label}
    </span>
  );
}
