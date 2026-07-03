import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import {
  collectIndexNowUrls,
  submitIndexNow,
  type IndexNowScope,
} from "@/lib/seo/indexnow";

const SCOPES = new Set<IndexNowScope>(["listings", "playbook", "all"]);

type SubmitBody = {
  scope?: IndexNowScope;
  urls?: string[];
};

/**
 * Submit URLs to IndexNow (Bing, Yandex, Seznam, Naver).
 * Admin-authenticated bulk submit for listings/playbook, or explicit URL list.
 */
export async function POST(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  let body: SubmitBody = {};
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    body = {};
  }

  const urls =
    Array.isArray(body.urls) && body.urls.length > 0
      ? body.urls
      : await collectIndexNowUrls(
          body.scope && SCOPES.has(body.scope) ? body.scope : "all",
        );

  const result = await submitIndexNow(urls);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, submitted: result.submitted, error: result.message },
      { status: result.status >= 400 ? result.status : 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    submitted: result.submitted,
    scope: body.scope ?? (body.urls?.length ? "custom" : "all"),
  });
}
