export type DatePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last28days"
  | "last30days"
  | "last90days"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export interface GaDateRange {
  preset: DatePreset;
  /** GA4 API value — ISO date or relative like "7daysAgo" */
  startDate: string;
  /** GA4 API value — ISO date or "today" / "yesterday" */
  endDate: string;
  /** ISO YYYY-MM-DD for DB queries */
  startIso: string;
  endIso: string;
  /** Human-readable label, e.g. "Jun 12 – Jul 11, 2026" */
  label: string;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOpts: Intl.DateTimeFormatOptions = { ...opts, year: "numeric" };
  const sameYear = start.getFullYear() === end.getFullYear();
  const startStr = start.toLocaleDateString("en-SG", sameYear ? opts : yearOpts);
  const endStr = end.toLocaleDateString("en-SG", yearOpts);
  if (isoDate(start) === isoDate(end)) return endStr;
  return `${startStr} – ${endStr}`;
}

/** Resolve a preset or custom ISO range into GA4 + DB date values. */
export function resolveDateRange(
  input: { preset?: DatePreset; startIso?: string; endIso?: string; days?: number } = {},
): GaDateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Legacy `days` param — maps to lastNdays preset
  if (!input.preset && input.days) {
    const d = Math.min(Math.max(1, input.days), 365);
    const preset: DatePreset =
      d === 7 ? "last7days" : d === 28 ? "last28days" : d === 90 ? "last90days" : "last30days";
    return resolveDateRange({ preset });
  }

  const preset = input.preset ?? "last30days";

  if (preset === "custom") {
    const startIso = input.startIso ?? isoDate(new Date(today.getTime() - 29 * 86_400_000));
    const endIso = input.endIso ?? isoDate(today);
    const start = new Date(startIso);
    const end = new Date(endIso);
    return {
      preset,
      startDate: startIso,
      endDate: endIso,
      startIso,
      endIso,
      label: formatLabel(start, end),
    };
  }

  let start: Date;
  let end: Date = new Date(today);
  let gaStart: string;
  let gaEnd = "today";

  switch (preset) {
    case "today":
      start = new Date(today);
      end = new Date(today);
      gaStart = "today";
      gaEnd = "today";
      break;
    case "yesterday": {
      start = new Date(today);
      start.setDate(start.getDate() - 1);
      end = new Date(start);
      gaStart = "yesterday";
      gaEnd = "yesterday";
      break;
    }
    case "last7days":
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      gaStart = "7daysAgo";
      break;
    case "last28days":
      start = new Date(today);
      start.setDate(start.getDate() - 27);
      gaStart = "28daysAgo";
      break;
    case "last30days":
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      gaStart = "30daysAgo";
      break;
    case "last90days":
      start = new Date(today);
      start.setDate(start.getDate() - 89);
      gaStart = "90daysAgo";
      break;
    case "thisWeek":
      start = startOfWeek(today);
      gaStart = isoDate(start);
      break;
    case "lastWeek": {
      const thisWeekStart = startOfWeek(today);
      start = new Date(thisWeekStart);
      start.setDate(start.getDate() - 7);
      end = new Date(thisWeekStart);
      end.setDate(end.getDate() - 1);
      gaStart = isoDate(start);
      gaEnd = isoDate(end);
      break;
    }
    case "thisMonth":
      start = startOfMonth(today);
      gaStart = isoDate(start);
      break;
    case "lastMonth": {
      const thisMonthStart = startOfMonth(today);
      start = new Date(thisMonthStart);
      start.setMonth(start.getMonth() - 1);
      end = new Date(thisMonthStart);
      end.setDate(end.getDate() - 1);
      gaStart = isoDate(start);
      gaEnd = isoDate(end);
      break;
    }
    default:
      start = new Date(today);
      start.setDate(start.getDate() - 29);
      gaStart = "30daysAgo";
  }

  return {
    preset,
    startDate: gaStart,
    endDate: gaEnd,
    startIso: isoDate(start),
    endIso: isoDate(end),
    label: formatLabel(start, end),
  };
}

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7days: "Last 7 days",
  last28days: "Last 28 days",
  last30days: "Last 30 days",
  last90days: "Last 90 days",
  thisWeek: "This week (Mon–Sun)",
  lastWeek: "Last week",
  thisMonth: "This month",
  lastMonth: "Last month",
  custom: "Custom range",
};
