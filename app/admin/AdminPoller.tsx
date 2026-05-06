"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL = 30_000;

function playBeep() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // Tres pitidos agudos y fuertes
    const beeps = [
      { freq: 1200, start: t },
      { freq: 1400, start: t + 0.18 },
      { freq: 1600, start: t + 0.36 },
    ];

    for (const b of beeps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(b.freq, b.start);
      gain.gain.setValueAtTime(0.9, b.start);
      gain.gain.exponentialRampToValueAtTime(0.001, b.start + 0.14);
      osc.start(b.start);
      osc.stop(b.start + 0.14);
    }
  } catch {}
}

export default function AdminPoller({ initialCount }: { initialCount: number }) {
  const router = useRouter();
  const lastCount = useRef(initialCount);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/admin/pending-count", { cache: "no-store" });
        if (!res.ok) return;
        const { count } = await res.json();
        if (count > lastCount.current) {
          const diff = count - lastCount.current;
          playBeep();
          if (Notification.permission === "granted") {
            new Notification("Casi Creativos — Nuevo pedido", {
              body: `Entraron ${diff} pedido${diff > 1 ? "s" : ""} nuevo${diff > 1 ? "s" : ""}.`,
              icon: "/logo.png",
            });
          }
          router.refresh();
        }
        lastCount.current = count;
      } catch {}
    }

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const id = setInterval(check, INTERVAL);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
