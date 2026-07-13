/** Parse an admin API response — never throw opaque JSON.parse errors on HTML 500 pages. */
export async function parseAdminJsonResponse<T>(
  res: Response,
  label: string,
): Promise<T> {
  const text = await res.text();

  if (!text.trim()) {
    if (!res.ok) throw new Error(`${label} failed (${res.status})`);
    throw new Error(`${label} returned an empty response`);
  }

  if (text.trimStart().startsWith("<")) {
    const hint =
      res.status === 504 || res.status === 408
        ? " The request timed out — article generation can take up to 90 seconds on Vercel Pro."
        : res.status >= 500
          ? " The server route crashed — check Vercel function logs."
          : "";
    throw new Error(`${label} returned an HTML error page (HTTP ${res.status}).${hint}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned invalid JSON (HTTP ${res.status})`);
  }

  if (!res.ok) {
    const body = data as { detail?: unknown; error?: unknown };
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : typeof body.error === "string"
          ? body.error
          : `${label} failed (HTTP ${res.status})`;
    throw new Error(detail);
  }

  return data as T;
}
