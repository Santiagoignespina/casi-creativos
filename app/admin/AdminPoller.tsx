"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL = 30_000;

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
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
