import { GA_MEASUREMENT_ID } from "@/lib/analytics/constants";
import { createPrivateKey, sign } from "node:crypto";

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function b64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function getGaAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const signingInput = `${header}.${payload}`;
  const key = createPrivateKey(sa.private_key);
  const sig = sign("RSA-SHA256", Buffer.from(signingInput), key);
  const jwt = `${signingInput}.${b64url(sig)}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = (await resp.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(`Token error: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function runGaReport(
  token: string,
  propertyId: string,
  body: unknown
): Promise<Record<string, unknown>> {
  const resp = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  return resp.json() as Promise<Record<string, unknown>>;
}

/** Resolve numeric GA4 property ID from a G-XXXXXXXX measurement ID. */
export async function resolvePropertyIdFromMeasurementId(
  token: string,
  measurementId: string
): Promise<string | null> {
  const accountsResp = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const accountsData = (await accountsResp.json()) as {
    accounts?: { name: string }[];
  };

  for (const account of accountsData.accounts ?? []) {
    const accountId = account.name.split("/")[1];
    const propsResp = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/${accountId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const propsData = (await propsResp.json()) as {
      properties?: { name: string }[];
    };

    for (const prop of propsData.properties ?? []) {
      const propId = prop.name.split("/")[1];
      const streamsResp = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/${prop.name}/dataStreams`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const streamsData = (await streamsResp.json()) as {
        dataStreams?: { webStreamData?: { measurementId?: string } }[];
      };

      for (const stream of streamsData.dataStreams ?? []) {
        if (stream.webStreamData?.measurementId === measurementId) {
          return propId;
        }
      }
    }
  }

  return null;
}

export function getGaConfig():
  | { ok: false; error: "GA4_NOT_CONFIGURED" }
  | { ok: true; sa: ServiceAccount; propertyId?: string; measurementId: string } {
  const saJson = process.env.GA_SERVICE_ACCOUNT_JSON;
  if (!saJson) return { ok: false, error: "GA4_NOT_CONFIGURED" };

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(saJson) as ServiceAccount;
  } catch {
    throw new Error("GA_CONFIG_INVALID");
  }

  const propertyId = process.env.GA_PROPERTY_ID;
  const measurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? GA_MEASUREMENT_ID;

  return { ok: true, sa, propertyId, measurementId };
}

export async function fetchGaAnalytics(days: number) {
  const config = getGaConfig();
  if (!config.ok) return { error: "GA4_NOT_CONFIGURED" as const };

  const { sa, measurementId } = config;
  let propertyId = config.propertyId;

  let token: string;
  try {
    token = await getGaAccessToken(sa);
  } catch (e) {
    return {
      error: "GA_AUTH_FAILED" as const,
      detail: e instanceof Error ? e.message : String(e),
    };
  }

  if (!propertyId) {
    try {
      propertyId = (await resolvePropertyIdFromMeasurementId(token, measurementId)) ?? undefined;
    } catch (e) {
      return {
        error: "GA_API_ERROR" as const,
        detail: e instanceof Error ? e.message : String(e),
      };
    }
    if (!propertyId) {
      return {
        error: "GA_API_ERROR" as const,
        detail: `No GA4 property found for measurement ID ${measurementId}. Add GA_PROPERTY_ID in Vercel env or grant the service account Viewer access.`,
      };
    }
  }

  const dateRange = [{ startDate: `${days}daysAgo`, endDate: "today" }];

  const [overview, sources, campaigns, topPages, scrollDepth, conversions, timeSeries, buttonClicks] =
    await Promise.all([
      runGaReport(token, propertyId, {
        dateRanges: dateRange,
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "newUsers" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      }),
      runGaReport(token, propertyId, {
        dateRanges: dateRange,
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runGaReport(token, propertyId, {
        dateRanges: dateRange,
        dimensions: [{ name: "sessionCampaignName" }],
        metrics: [{ name: "sessions" }, { name: "conversions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }),
      runGaReport(token, propertyId, {
        dateRanges: dateRange,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "averageSessionDuration" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      runGaReport(token, propertyId, {
        dateRanges: dateRange,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: ["scroll_25", "scroll_50", "scroll_75", "scroll_100"],
            },
          },
        },
      }),
      runGaReport(token, propertyId, {
        dateRanges: dateRange,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: ["click_whatsapp", "generate_lead", "video_play", "listing_view"],
            },
          },
        },
      }),
      runGaReport(token, propertyId, {
        dateRanges: dateRange,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      runGaReport(token, propertyId, {
        dateRanges: dateRange,
        dimensions: [{ name: "customEvent:button_label" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            stringFilter: { matchType: "EXACT", value: "button_click" },
          },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 10,
      }),
    ]);

  const apiError = (overview as { error?: { message?: string; status?: string } }).error;
  if (apiError) {
    return {
      error: "GA_API_ERROR" as const,
      detail: apiError.message ?? "Google Analytics Data API request failed.",
      status: apiError.status,
    };
  }

  return {
    overview,
    sources,
    campaigns,
    topPages,
    scrollDepth,
    conversions,
    timeSeries,
    buttonClicks,
    days,
    propertyId,
    measurementId,
  };
}
