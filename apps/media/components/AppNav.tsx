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
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-neutral-900">HomeUp Media</span>
          <nav className="flex gap-4">
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">{email}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
