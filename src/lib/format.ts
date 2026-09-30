/** 75 → "1:15", 3725 → "1:02:05" */
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** 1234 → "1.2K" */
export function formatCompact(n: number) {
  return compact.format(n);
}

export function formatViews(n: number) {
  return `${formatCompact(n)} ${n === 1 ? "view" : "views"}`;
}

export function formatSubscribers(n: number) {
  return `${formatCompact(n)} ${n === 1 ? "subscriber" : "subscribers"}`;
}

export function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${n.toLocaleString("en")} ${n === 1 ? singular : plural}`;
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "3 days ago" */
export function timeAgo(date: Date | string | number) {
  const seconds = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
}

export function formatHours(seconds: number) {
  const hours = seconds / 3600;
  return hours >= 100 ? formatCompact(Math.round(hours)) : hours.toFixed(1);
}
