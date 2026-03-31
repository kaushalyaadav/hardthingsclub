"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";

export default function SignInButton() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  const router = useRouter();

  const onLogin = async () => {
    if (!email.trim() || !password) return;
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
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        className="w-full rounded-xl border border-neutral-300 px-3 py-3 text-sm"
      />
      <button onClick={onLogin} disabled={status === "loading"} className="w-full rounded-xl bg-black text-white py-3 text-sm font-medium disabled:opacity-70">
        {status === "loading" ? "Logging in..." : "Login"}
      </button>
      {status === "error" && <p className="text-xs text-red-600">{errorText || "Login failed."}</p>}
    </div>
  );
}
