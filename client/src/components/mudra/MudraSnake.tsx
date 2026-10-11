"use client";

import React, { useEffect, useRef, useState } from "react";

interface Segment {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function MudraSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Number of articulated segments in the snake ribbon
    const NUM_SEGMENTS = 20;
    const SEGMENT_DISTANCE = 14;
    const SPRING_EASE = 0.32;

    // Initial position on the vertical right rail
    const initialX = width * 0.82;
    const initialY = height * 0.3;

    const segments: Segment[] = Array.from({ length: NUM_SEGMENTS }, () => ({
      x: initialX,
      y: initialY,
      vx: 0,
      vy: 0,
    }));

    // Target tracking state
    let mouseX = initialX;
    let mouseY = initialY;
    let hasMouseInteracted = false;
    let lastMouseMoveTime = 0;
    let targetX = initialX;
    let targetY = initialY;
    let scrollProgress = 0;

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();

    // Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      hasMouseInteracted = true;
      lastMouseMoveTime = performance.now();
    };

    // Scroll Tracking
    const handleScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = docH > 0 ? (window.scrollY || 0) / docH : 0;
    };

    handleScroll();

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    let t = 0;

    // Main Kinematic Animation Loop
    const render = () => {
      t += 0.025;
      const now = performance.now();
      const isMouseActive = hasMouseInteracted && now - lastMouseMoveTime < 3200;

      if (isMouseActive) {
        // Gravitate with smooth momentum toward mouse cursor
        targetX += (mouseX - targetX) * 0.12;
        targetY += (mouseY - targetY) * 0.12;
      } else {
        // Ambient scroll progression down the Swiss vertical spine
        const spineBaseX = width > 768 ? width * 0.82 : width * 0.5;
        const waveX = Math.sin(t * 1.2) * 45;
        const scrollTargetY = 80 + scrollProgress * (height - 180) + Math.cos(t * 1.5) * 28;

        targetX += (spineBaseX + waveX - targetX) * 0.08;
        targetY += (scrollTargetY - targetY) * 0.08;
      }

      // Head physics (spring toward target)
      segments[0].vx = (targetX - segments[0].x) * SPRING_EASE;
      segments[0].vy = (targetY - segments[0].y) * SPRING_EASE;
      segments[0].x += segments[0].vx;
      segments[0].y += segments[0].vy;

      // Inverse Kinematics for trailing segments
      for (let i = 1; i < NUM_SEGMENTS; i++) {
        const prev = segments[i - 1];
        const curr = segments[i];

        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const force = (dist - SEGMENT_DISTANCE) * 0.45;
          curr.vx += (dx / dist) * force;
          curr.vy += (dy / dist) * force;
        }

        // Apply friction/damping
        curr.vx *= 0.68;
        curr.vy *= 0.68;
        curr.x += curr.vx;
        curr.y += curr.vy;
      }

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Draw Articulated Ribbon Tail (Multi-curve Path)
      if (segments.length > 2) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(segments[0].x, segments[0].y);

        for (let i = 1; i < segments.length - 1; i++) {
          const xc = (segments[i].x + segments[i + 1].x) / 2;
          const yc = (segments[i].y + segments[i + 1].y) / 2;
          ctx.quadraticCurveTo(segments[i].x, segments[i].y, xc, yc);
        }

        ctx.lineTo(segments[segments.length - 1].x, segments[segments.length - 1].y);

        // Gradient from Sky Blue to Signal Yellow
        const grad = ctx.createLinearGradient(
          segments[0].x,
          segments[0].y,
          segments[segments.length - 1].x,
          segments[segments.length - 1].y
        );
        grad.addColorStop(0, "#3BBFF7"); // Mudra Sky Blue
        grad.addColorStop(0.5, "#EEA02B"); // Mudra Signal Yellow
        grad.addColorStop(1, "rgba(7, 162, 64, 0.2)"); // Mudra Link Green tail

        ctx.strokeStyle = grad;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(59, 191, 247, 0.45)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();

        // Draw Articulated Joints (Swiss Geometric Beads)
        for (let i = 2; i < segments.length; i += 3) {
          const seg = segments[i];
          const radius = Math.max(1.8, 3.8 - (i / NUM_SEGMENTS) * 2.2);

          ctx.save();
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? "#EEA02B" : "#3BBFF7";
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw Head Node (Swiss Rupee Orbit Indicator)
      const head = segments[0];
      const headAngle = Math.atan2(head.vy, head.vx) || 0;

      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(headAngle);

      // Outer Glowing Ring
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.strokeStyle = "#3BBFF7";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(59, 191, 247, 0.8)";
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Inner Core Node
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = "#EEA02B";
      ctx.fill();

      // Directional Leading Beacon
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(15, 0);
      ctx.strokeStyle = "#3BBFF7";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 45,
        display: "block",
      }}
    />
  );
}
