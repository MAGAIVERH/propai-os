"use client";

import { useState } from "react";
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, pointerWithin } from "@dnd-kit/core";
import type { LeadResponse } from "@propai/shared";

import { KanbanCardOverlay } from "./kanban-card";
import { KanbanColumn, KanbanColumnSkeleton } from "./kanban-column";
import { useKanban } from "../hooks/use-kanban";

export function KanbanBoard() {
  const { stages, leadsByStage, isPending, moveLead } = useKanban();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<LeadResponse | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const lead = event.active.data.current?.lead as LeadResponse | undefined;

    setActiveLeadId(event.active.id as string);
    setActiveLead(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveLeadId(null);
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const targetStageId = over.id as string;
    const lead = active.data.current?.lead as LeadResponse | undefined;

    if (!lead) return;

    // Skip if dropped on the same stage
    if (lead.stageId === targetStageId) return;

    moveLead(leadId, targetStageId);
  }

  if (isPending) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }, (_, i) => (
          <KanbanColumnSkeleton key={`skel-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage.get(stage.id) ?? []}
            activeLeadId={activeLeadId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <KanbanCardOverlay lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
