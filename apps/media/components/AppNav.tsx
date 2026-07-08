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
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-y-1 px-4 py-2.5">
        {/* Brand + nav */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-sm font-semibold text-neutral-900">HomeUp Media</span>
          <nav className="flex flex-wrap gap-x-3 gap-y-1">
            <a href="/upload" className="text-sm text-neutral-600 hover:text-neutral-900">
              Videos
            </a>
            <a href="/upload/raw" className="text-sm text-neutral-600 hover:text-neutral-900">
              Images
            </a>
            <a href="/generate" className="text-sm text-neutral-600 hover:text-neutral-900">
              Generate
            </a>
            <a href="/executions" className="text-sm text-neutral-600 hover:text-neutral-900">
              Executions
            </a>
          </nav>
        </div>

        {/* Sign out — email hidden on small screens */}
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-neutral-400 sm:inline">{email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
