"use client";

import type { AnalyticsAgent } from "@propai/shared";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export function AgentLeaderboard({ agents }: { agents: AnalyticsAgent[] }) {
  if (agents.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No leads have been assigned to agents yet.
      </p>
    );
  }

  return (
    <Table className="min-w-[460px]">
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead className="text-right">Leads</TableHead>
          <TableHead className="text-right">Won</TableHead>
          <TableHead className="text-right">Lost</TableHead>
          <TableHead className="text-right">Conversion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((a) => (
          <TableRow key={a.agentId}>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-full text-xs font-semibold">
                  {initials(a.agentName)}
                </span>
                <span className="font-medium">{a.agentName ?? "Unknown agent"}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">{a.totalLeads}</TableCell>
            <TableCell className="text-primary text-right">{a.wonLeads}</TableCell>
            <TableCell className="text-muted-foreground text-right">{a.lostLeads}</TableCell>
            <TableCell className="text-right font-medium">
              {(a.conversionRate * 100).toFixed(0)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
