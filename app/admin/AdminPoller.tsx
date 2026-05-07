"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL = 30_000;

function playBeep() {
  try {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.setValueAtTime(1.5, ctx.currentTime);
    master.connect(ctx.destination);
    const t = ctx.currentTime;

    // 5 pitidos x 3 rondas, agudos, onda cuadrada + sawtooth mezclados, volumen al límite
    const roundDuration = 0.75;
    const beeps: number[] = [];
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 5; i++) beeps.push(t + r * roundDuration + i * 0.15);
    }

    for (const start of beeps) {
      for (const type of ["square", "sawtooth"] as OscillatorType[]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(master);
        osc.type = type;
        osc.frequency.setValueAtTime(1800, start);
        osc.frequency.linearRampToValueAtTime(2200, start + 0.12);
        gain.gain.setValueAtTime(1.0, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
        osc.start(start);
        osc.stop(start + 0.13);
      }
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
