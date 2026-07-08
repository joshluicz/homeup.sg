"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AppNavProps = {
  email: string;
};

export function AppNav({ email }: AppNavProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="border-b border-neutral-200 bg-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Row 1: brand + sign-out */}
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-2.5 pb-1.5">
        <span className="text-sm font-semibold text-neutral-900">HomeUp Media</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
        >
          Sign out
        </button>
      </div>

      {/* Row 2: nav links */}
      <div className="mx-auto flex max-w-3xl items-center gap-5 overflow-x-auto px-4 pb-2.5">
        <a href="/upload" className="whitespace-nowrap text-sm text-neutral-600 hover:text-neutral-900">
          Videos
        </a>
        <a href="/upload/raw" className="whitespace-nowrap text-sm text-neutral-600 hover:text-neutral-900">
          Images
        </a>
        <a href="/generate" className="whitespace-nowrap text-sm text-neutral-600 hover:text-neutral-900">
          Generate
        </a>
        <a href="/executions" className="whitespace-nowrap text-sm text-neutral-600 hover:text-neutral-900">
          Executions
        </a>
      </div>
    </header>
  );
}
