"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { LeadResponse } from "@propai/shared";
import { ExternalLink, GripVertical } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type KanbanCardProps = {
  lead: LeadResponse;
  isDragging?: boolean;
};

function scoreTone(score: number): string {
  if (score >= 70) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function initials(lead: LeadResponse): string {
  return ((lead.firstName[0] ?? "") + (lead.lastName[0] ?? "")).toUpperCase();
}

function CardBody({ lead }: { lead: LeadResponse }) {
  return (
    <>
      {/* Header: name + hover actions */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-foreground truncate text-sm font-semibold">
          {lead.firstName} {lead.lastName}
        </p>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Link
            href={`/leads/${lead.id}`}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground rounded p-0.5"
            aria-label="Open lead detail"
          >
            <ExternalLink className="size-3.5" />
          </Link>
          <GripVertical className="text-muted-foreground/60 size-4" />
        </div>
      </div>

      {lead.source ? (
        <p className="text-muted-foreground truncate text-xs">via {lead.source}</p>
      ) : null}

      {/* Footer: score · time · agent */}
      <div className="mt-0.5 flex items-center gap-2">
        {lead.aiScore != null ? (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
              scoreTone(lead.aiScore),
            )}
          >
            AI {lead.aiScore}
          </span>
        ) : null}
        <span className="text-muted-foreground/70 text-[10px] tabular-nums">
          {timeAgo(lead.createdAt)}
        </span>
        <span
          className="bg-primary/10 text-primary ml-auto flex size-6 items-center justify-center rounded-full text-[9px] font-bold"
          title={lead.assignedAgentId ?? undefined}
        >
          {initials(lead)}
        </span>
      </div>
    </>
  );
}

export function KanbanCard({ lead, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-flip-id={lead.id}
      className={cn(
        "group border-border bg-card flex cursor-grab flex-col gap-1.5 rounded-xl border p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        isDragging && "ring-primary/30 opacity-50 shadow-lg ring-2",
      )}
      {...attributes}
      {...listeners}
    >
      <CardBody lead={lead} />
    </div>
  );
}

/** Overlay clone rendered inside DragOverlay (no transform applied). */
export function KanbanCardOverlay({ lead }: { lead: LeadResponse }) {
  return (
    <div className="group border-border bg-card ring-primary/40 flex cursor-grabbing flex-col gap-1.5 rounded-xl border p-3 shadow-xl ring-2">
      <CardBody lead={lead} />
    </div>
  );
}
