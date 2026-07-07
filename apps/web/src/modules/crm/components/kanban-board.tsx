"use client";

import { useCallback, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  pointerWithin,
} from "@dnd-kit/core";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import type { LeadResponse } from "@propai/shared";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { KanbanCardOverlay } from "./kanban-card";
import { KanbanColumn, KanbanColumnSkeleton } from "./kanban-column";
import { useKanban } from "../hooks/use-kanban";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

const CARD_SELECTOR = "[data-flip-id]";
const WON_CELEBRATION_MS = 1200;

export function KanbanBoard() {
  const { stages, leadsByStage, isPending, moveLead } = useKanban();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<LeadResponse | null>(null);
  const [celebratingStageId, setCelebratingStageId] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const flipStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const lead = event.active.data.current?.lead as LeadResponse | undefined;
    setActiveLeadId(event.active.id as string);
    setActiveLead(lead ?? null);
  }

  const playFlip = useCallback(() => {
    if (!flipStateRef.current) return;
    const state = flipStateRef.current;
    flipStateRef.current = null;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Flip.from(state, {
          duration: 0.35,
          ease: "power2.out",
          stagger: 0.03,
          absolute: true,
        });
      });
    });
  }, []);

  const playCelebration = useCallback((columnEl: Element) => {
    gsap
      .timeline()
      .to(columnEl, { scale: 1.025, duration: 0.18, ease: "power2.out" })
      .to(columnEl, { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.45)" });
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveLeadId(null);
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const targetStageId = over.id as string;
    const lead = active.data.current?.lead as LeadResponse | undefined;

    if (!lead || lead.stageId === targetStageId) return;

    if (!reducedMotion) {
      flipStateRef.current = Flip.getState(CARD_SELECTOR);
    }

    moveLead(leadId, targetStageId);

    if (!reducedMotion) {
      playFlip();

      const targetStage = stages.find((s) => s.id === targetStageId);
      if (targetStage?.isWon) {
        setCelebratingStageId(targetStageId);
        const columnEl = document.querySelector(`[data-column-id="${targetStageId}"]`);
        if (columnEl) playCelebration(columnEl);
        setTimeout(() => setCelebratingStageId(null), WON_CELEBRATION_MS);
      }
    }
  }

  if (isPending) {
    return (
      <div className="flex gap-3">
        {Array.from({ length: 5 }, (_, i) => (
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
      {/* Columns share the width equally (flex-1) so every stage fits without a
          page or board horizontal scrollbar. */}
      <div className="flex items-stretch gap-3">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={leadsByStage.get(stage.id) ?? []}
            activeLeadId={activeLeadId}
            isWonCelebrating={celebratingStageId === stage.id}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <KanbanCardOverlay lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
