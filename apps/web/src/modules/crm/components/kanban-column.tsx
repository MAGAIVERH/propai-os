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
      className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-0 lg:flex-1"
      data-column-id={stage.id}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-0.5">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        <h3 className="truncate text-sm font-semibold text-foreground">{stage.name}</h3>
        <span className="bg-muted text-muted-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {leads.length}
        </span>
      </div>

      {/* Drop zone / lane */}
      <div
        ref={setNodeRef}
        className={cn(
          "border-border/60 bg-muted/30 flex min-h-[7rem] flex-1 flex-col gap-2.5 rounded-2xl border p-2.5 transition-colors lg:min-h-[26rem]",
          isOver && "border-primary/50 bg-primary/5 border-solid",
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
          <div className="text-muted-foreground/60 flex flex-1 items-center justify-center py-8 text-xs">
            No leads
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function KanbanColumnSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-0 lg:flex-1">
      <div className="flex items-center gap-2 px-0.5">
        <Skeleton className="size-2.5 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="border-border/60 bg-muted/30 flex min-h-[7rem] flex-col gap-2.5 rounded-2xl border p-2.5 lg:min-h-[26rem]">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={`col-skel-${i}`}
            className="border-border bg-card flex flex-col gap-2 rounded-xl border p-3"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
