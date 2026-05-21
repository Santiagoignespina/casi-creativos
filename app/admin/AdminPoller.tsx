"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const INTERVAL = 30_000;

function playBeep(ctx: AudioContext) {
  try {
    const master = ctx.createGain();
    master.gain.setValueAtTime(1.5, ctx.currentTime);
    master.connect(ctx.destination);
    const t = ctx.currentTime;

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
  const audioCtx = useRef<AudioContext | null>(null);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // iOS Safari (no PWA) no expone la Notification API. Tocarla tira ReferenceError
    // que escala al error boundary y muestra "Error de aplicación".
    const hasNotifications = typeof window !== "undefined" && "Notification" in window;

    // Crear el AudioContext en el primer click del usuario para que el navegador lo permita.
    // iOS Safari < 14.5 solo expone webkitAudioContext.
    function unlockAudio() {
      if (audioCtx.current) return;
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) audioCtx.current = new Ctx();
      } catch {}
    }
    document.addEventListener("click", unlockAudio, { once: true });

    async function check() {
      try {
        const res = await fetch("/api/admin/pending-count", { cache: "no-store" });
        if (!res.ok) return;
        const { count } = await res.json();
        if (count > lastCount.current) {
          const diff = count - lastCount.current;
          if (audioCtx.current) {
            // Reanudar el contexto si el navegador lo suspendió (ej: pestaña en segundo plano)
            if (audioCtx.current.state === "suspended") {
              await audioCtx.current.resume();
            }
            playBeep(audioCtx.current);
          }
          if (hasNotifications && Notification.permission === "granted") {
            try {
              new Notification("Casi Creativos — Nuevo pedido", {
                body: `Entraron ${diff} pedido${diff > 1 ? "s" : ""} nuevo${diff > 1 ? "s" : ""}.`,
                icon: "/logo.png",
              });
            } catch {}
          }
          router.refresh();
        }
        lastCount.current = count;
      } catch {}
    }

    function startPolling() {
      if (intervalId.current !== null) return;
      check();
      intervalId.current = setInterval(check, INTERVAL);
    }

    function stopPolling() {
      if (intervalId.current === null) return;
      clearInterval(intervalId.current);
      intervalId.current = null;
    }

    // Pausar el polling cuando la pestaña no está visible — evita pegar a Neon
    // 24/7 mientras el admin queda abierto en background y agotar el free tier.
    function handleVisibility() {
      if (document.visibilityState === "visible") startPolling();
      else stopPolling();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    if (hasNotifications && Notification.permission === "default") {
      try {
        Notification.requestPermission();
      } catch {}
    }

    if (document.visibilityState === "visible") startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("click", unlockAudio);
    };
  }, [router]);

  return null;
}
