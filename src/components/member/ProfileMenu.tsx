"use client";

import { createClient } from "@/lib/supabaseBrowser";

export default function ProfileMenu({ initials }: { initials: string }) {
  const logout = async () => {
    await createClient().auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-black text-[10px] font-semibold text-white">
        {initials}
      </div>
      <button onClick={logout} className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors">
        Log out
      </button>
    </div>
  );
}
