"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { LeadResponse } from "@propai/shared";
import { GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type KanbanCardProps = {
  lead: LeadResponse;
  isDragging?: boolean;
};

function aiScoreBadgeVariant(
  score: number,
): "default" | "secondary" | "outline" {
  if (score >= 70) return "default";
  if (score >= 40) return "secondary";
  return "outline";
}

export function KanbanCard({ lead, isDragging = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex cursor-grab flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary/30",
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {lead.firstName} {lead.lastName}
        </p>
        <GripVertical className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Source / property interest */}
      {lead.source ? (
        <p className="truncate text-xs text-muted-foreground">
          via {lead.source}
        </p>
      ) : null}

      {/* Footer: AI score + agent avatar */}
      <div className="flex items-center justify-between gap-2">
        {lead.aiScore != null ? (
          <Badge variant={aiScoreBadgeVariant(lead.aiScore)} className="text-[10px]">
            AI {lead.aiScore}
          </Badge>
        ) : (
          <span />
        )}

        {lead.assignedAgentId ? (
          <span
            className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold uppercase text-muted-foreground"
            title={lead.assignedAgentId}
          >
            A
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Overlay clone rendered inside DragOverlay (no transform applied). */
export function KanbanCardOverlay({ lead }: { lead: LeadResponse }) {
  return (
    <div className="flex cursor-grabbing flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-xl ring-2 ring-primary/40">
      <p className="text-sm font-semibold leading-tight text-foreground">
        {lead.firstName} {lead.lastName}
      </p>

      {lead.source ? (
        <p className="truncate text-xs text-muted-foreground">via {lead.source}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {lead.aiScore != null ? (
          <Badge variant={aiScoreBadgeVariant(lead.aiScore)} className="text-[10px]">
            AI {lead.aiScore}
          </Badge>
        ) : (
          <span />
        )}

        {lead.assignedAgentId ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold uppercase text-muted-foreground">
            A
          </span>
        ) : null}
      </div>
    </div>
  );
}
