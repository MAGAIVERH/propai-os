"use client";

import { useDroppable } from "@dnd-kit/core";
import type { LeadResponse, PipelineStage } from "@propai/shared";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./kanban-card";

type KanbanColumnProps = {
  stage: PipelineStage;
  leads: LeadResponse[];
  activeLeadId: string | null;
  isWonCelebrating?: boolean;
};

export function KanbanColumn({ stage, leads, activeLeadId, isWonCelebrating = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      className="flex w-64 shrink-0 flex-col gap-3"
      data-column-id={stage.id}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-1">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-48 flex-col gap-2 rounded-2xl border border-border bg-muted/40 p-2 transition-colors",
          isOver && "border-primary/50 bg-primary/5",
          isWonCelebrating && "border-emerald-400/60 bg-emerald-50/40 dark:bg-emerald-950/20",
        )}
      >
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            isDragging={lead.id === activeLeadId}
          />
        ))}

        {leads.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Drop leads here
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="flex w-64 shrink-0 flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <Skeleton className="size-2.5 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex min-h-48 flex-col gap-2 rounded-2xl border border-border bg-muted/40 p-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={`col-skel-${i}`}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
