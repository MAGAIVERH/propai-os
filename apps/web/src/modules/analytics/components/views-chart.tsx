"use client";

import type { AnalyticsViewsPoint } from "@propai/shared";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ViewsChart({
  points,
  animate,
}: {
  points: AnalyticsViewsPoint[];
  animate: boolean;
}) {
  if (points.length === 0) {
    return <p className="text-muted-foreground py-12 text-center text-sm">No view data yet.</p>;
  }

  const data = points.map((p) => ({
    // Short label like "Jun 24"
    label: new Date(p.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    views: p.views,
  }));

  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          stroke="#71717a"
          fontSize={11}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} width={28} />
        <Tooltip
          contentStyle={{
            background: "var(--color-card, #18181b)",
            border: "1px solid var(--color-border, #27272a)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="views"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#viewsGradient)"
          isAnimationActive={animate}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
