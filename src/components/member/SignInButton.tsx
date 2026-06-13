"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseBrowser";
import { hasSupabaseConfig } from "@/lib/supabaseEnv";

export default function SignInButton() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const configured = hasSupabaseConfig();

  const onLogin = async () => {
    if (!configured || !email.trim() || !password) return;
    setStatus("loading");
    setErrorText("");
    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });
    if (error) {
      setErrorText(error.message);
      setStatus("error");
      return;
    }
    setStatus("idle");
    window.location.href = "/";
  };

  return (
    <div className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        disabled={!configured}
        className="w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        disabled={!configured}
        className="w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm disabled:cursor-not-allowed disabled:bg-neutral-100"
      />
      <button
        onClick={onLogin}
        disabled={!configured || status === "loading"}
        className={`w-full rounded-xl py-3 text-sm font-medium transition-colors ${
          status === "loading"
            ? "bg-blue-400 text-white cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-4 w-4 border-2 border-blue-200 border-r-white rounded-full animate-spin" />
            Logging in...
          </span>
        ) : (
          "Login"
        )}
      </button>
      {status === "error" && <p className="text-xs text-red-600">{errorText || "Login failed."}</p>}
    </div>
  );
}
