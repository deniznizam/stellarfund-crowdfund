"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#6366f1", "#818cf8", "#22d3ee", "#f472b6",
  "#a78bfa", "#34d399", "#fbbf24", "#fb923c",
];

type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  shape: "rect" | "circle" | "star";
};

function drawStar(ctx: CanvasRenderingContext2D, r: number) {
  const spikes = 5;
  const outer = r;
  const inner = r / 2;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(Math.cos(rot) * outer, Math.sin(rot) * outer);
    rot += step;
    ctx.lineTo(Math.cos(rot) * inner, Math.sin(rot) * inner);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Two bursts: left + right
    const spawnBurst = (cx: number) => {
      for (let i = 0; i < 50; i++) {
        particles.current.push({
          x: cx,
          y: canvas.height * 0.35,
          vx: (Math.random() - 0.5) * 14,
          vy: -(Math.random() * 10 + 4),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 10 + 5,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          shape: (["rect", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
        });
      }
    };

    spawnBurst(canvas.width * 0.3);
    spawnBurst(canvas.width * 0.7);
    setTimeout(() => spawnBurst(canvas.width * 0.5), 200);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.opacity > 0.01);

      for (const p of particles.current) {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, p.size / 2);
        }

        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotSpeed;

        // Fade when below 2/3 of screen
        if (p.y > canvas.height * 0.6) {
          p.opacity -= 0.025;
        }
      }

      if (particles.current.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      aria-hidden
    />
  );
}
