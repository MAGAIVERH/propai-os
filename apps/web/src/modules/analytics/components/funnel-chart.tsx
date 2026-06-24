"use client";

import type { AnalyticsFunnelStage } from "@propai/shared";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function barColor(stage: AnalyticsFunnelStage): string {
  if (stage.isWon) return "var(--color-primary, #10b981)";
  if (stage.isLost) return "#ef4444";
  return "#6366f1";
}

export function FunnelChart({
  stages,
  animate,
}: {
  stages: AnalyticsFunnelStage[];
  animate: boolean;
}) {
  if (stages.length === 0) {
    return <p className="text-muted-foreground py-12 text-center text-sm">No pipeline data yet.</p>;
  }

  const data = [...stages]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({ name: s.stageName, leads: s.leadCount, stage: s }));

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart layout="vertical" data={data} margin={{ left: 8, right: 16 }}>
        <XAxis type="number" allowDecimals={false} stroke="#71717a" fontSize={12} />
        <YAxis type="category" dataKey="name" width={120} stroke="#71717a" fontSize={12} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "var(--color-card, #18181b)",
            border: "1px solid var(--color-border, #27272a)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="leads" radius={[0, 6, 6, 0]} isAnimationActive={animate}>
          {data.map((d) => (
            <Cell key={d.name} fill={barColor(d.stage)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
