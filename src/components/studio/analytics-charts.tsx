"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "@/server/queries/studio";

const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" });

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">{fmtDay(label)}</p>
      <p className="mt-0.5 font-semibold tabular-nums">
        {payload[0].value.toLocaleString("en")} {unit}
      </p>
    </div>
  );
}

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

export function ViewsChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Views per day over the last 28 days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={24} {...axis} />
          <YAxis allowDecimals={false} width={44} {...axis} />
          <Tooltip content={<ChartTooltip unit="views" />} cursor={{ stroke: "var(--border)" }} />
          <Area type="monotone" dataKey="views" stroke="var(--chart-1)" strokeWidth={2} fill="url(#viewsFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WatchTimeChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Watch time in hours per day over the last 28 days">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="date" tickFormatter={fmtDay} minTickGap={24} {...axis} />
          <YAxis width={44} {...axis} />
          <Tooltip content={<ChartTooltip unit="hours" />} cursor={{ fill: "var(--accent)" }} />
          <Bar dataKey="watchHours" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
