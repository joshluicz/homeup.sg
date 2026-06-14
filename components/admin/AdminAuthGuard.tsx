"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function ensureSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const loginUrl = new URL("/admin/login", window.location.origin);
        loginUrl.searchParams.set("redirect", pathname);
        router.replace(`${loginUrl.pathname}${loginUrl.search}`);
        return;
      }

      setReady(true);
    }

    void ensureSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return children;
}
