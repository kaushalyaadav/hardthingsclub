"use client";

import { useEffect, useState } from "react";

type Step = "idle" | "prompt" | "time" | "saving" | "done" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSetup() {
  const [step, setStep] = useState<Step>("idle");
  const [hour, setHour] = useState(8);     // 1–12
  const [minute, setMinute] = useState(0); // 0–59
  const [ampm, setAmpm] = useState<"AM" | "PM">("PM");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Check if notification already set up
    const saved = localStorage.getItem("htc-push-setup");
    if (saved === "done") {
      setStep("done");
      return;
    }

    // Capture install prompt (doesn't fire on iOS)
    let promptFired = false;
    const handler = (e: Event) => {
      e.preventDefault();
      promptFired = true;
      setDeferredPrompt(e);
      setStep("prompt");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // On iOS/Safari or if no install prompt fires after 1s, skip to reminder setup
    const timer = setTimeout(() => {
      if (!promptFired) {
        setStep("time");
      }
    }, 1000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  // Don't show anything if already done or unsupported
  if (step === "done" || step === "idle") return null;
  if (step === "unsupported") return null;

  const hour24 = ampm === "AM" ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
  const minuteDisplay = String(minute).padStart(2, "0");

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") setStep("time");
    } else {
      setStep("time"); // Skip install step if no prompt available
    }
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStep("time"); // Skip push, just save time preference for future
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "denied") { setStep("denied"); return; }
    if (permission !== "granted") return;
    setStep("time");
  };

  const handleSaveTime = async () => {
    setStep("saving");
    try {
      let subscription = null;

      if ("serviceWorker" in navigator && "PushManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const existing = await reg.pushManager.getSubscription();
          subscription = existing || await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        }
      }

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription?.toJSON() ?? {},
          reminder_hour: hour24,
          reminder_minute: minute,
        }),
      });

      localStorage.setItem("htc-push-setup", "done");
      setStep("done");
    } catch {
      localStorage.setItem("htc-push-setup", "done");
      setStep("done");
    }
  };

  return (
    <div className="mx-4 mb-3 overflow-hidden rounded-xl border border-blue-100 bg-blue-50">
      {step === "prompt" && (
        <div className="flex items-start gap-3 p-3">
          <img src="/htc-logo.jpg" alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Add Hard Things Club to your home screen</p>
            <p className="text-xs text-neutral-500 mt-0.5">Log faster, get daily reminders, works like an app.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={handleInstall}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
                Add to Home Screen
              </button>
              <button onClick={() => setStep("time")}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "time" && (
        <div className="p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Set your daily reminder</p>
            <p className="text-xs text-neutral-500 mt-0.5">We&apos;ll remind you to log if you haven&apos;t already.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Hour */}
            <select value={hour} onChange={(e) => setHour(Number(e.target.value))}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span className="text-neutral-400 font-medium">:</span>
            {/* Minute */}
            <select value={minute} onChange={(e) => setMinute(Number(e.target.value))}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
              ))}
            </select>
            {/* AM/PM */}
            <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
              {(["AM", "PM"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setAmpm(p)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${ampm === p ? "bg-black text-white" : "bg-white text-neutral-500"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-400">
            Reminder set for {hour}:{minuteDisplay} {ampm} IST every day
          </p>
          <div className="flex gap-2">
            <button onClick={handleSaveTime}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Save reminder
            </button>
            <button onClick={() => { localStorage.setItem("htc-push-setup", "done"); setStep("done"); }}
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-500">
              No thanks
            </button>
          </div>
        </div>
      )}

      {step === "saving" && (
        <div className="p-4 text-sm text-neutral-500">Setting up your reminder…</div>
      )}

      {step === "denied" && (
        <div className="flex items-center justify-between p-3">
          <p className="text-xs text-neutral-500">Notifications blocked. Enable them in browser settings to get reminders.</p>
          <button onClick={() => { localStorage.setItem("htc-push-setup", "done"); setStep("done"); }}
            className="ml-2 shrink-0 text-xs text-neutral-400">✕</button>
        </div>
      )}
    </div>
  );
}
