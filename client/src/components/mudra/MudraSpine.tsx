"use client";

import React, { useEffect, useState } from "react";

export function MudraSpine() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const prog = docH > 0 ? Math.min(1, Math.max(0, y / docH)) : 0;
      setScrollProgress(prog);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <svg
      data-spine=""
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        zIndex: 5,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient id="spine-hue" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0" stopColor="var(--Mudra-sky-blue)" />
          <stop offset="90%" stopColor="var(--Mudra-sky-blue)" />
          <stop offset="100%" stopColor="#8B8A88" />
        </linearGradient>
      </defs>

      {/* Decorative Orthogonal Spine Path */}
      <path
        d="M 85% 240 L 85% 1200 Q 85% 1240 80% 1240 L 25% 1240 Q 20% 1240 20% 1280 L 20% 2800 Q 20% 2840 25% 2840 L 88% 2840 Q 93% 2840 93% 2880 L 93% 4600 Q 93% 4640 88% 4640 L 76% 4640 Q 71% 4640 71% 4680 L 71% 6500"
        fill="none"
        stroke="url(#spine-hue)"
        strokeWidth="16"
        strokeLinecap="round"
        style={{
          strokeDasharray: 9000,
          strokeDashoffset: 9000 * (1 - scrollProgress * 1.2),
          transition: "stroke-dashoffset 80ms linear",
        }}
      />

      {/* Start Circle */}
      <circle
        cx="85%"
        cy="240"
        r="32"
        fill="var(--surface-canvas)"
        stroke="var(--Mudra-sky-blue)"
        strokeWidth="16"
      />
    </svg>
  );
}

