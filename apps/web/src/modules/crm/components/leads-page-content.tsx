"use client";

import { useEffect } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";
import { ApiClientError } from "@/lib/api-client";
import { useKanban } from "../hooks/use-kanban";
import { KanbanBoard } from "./kanban-board";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return "Unable to load leads. Check that the API is running.";
}

export function LeadsPageContent() {
  const { stages, leads, isPending, isError } = useKanban();

  useEffect(() => {
    if (isError) {
      toast.error(getErrorMessage(undefined));
    }
  }, [isError]);

  const isEmpty = !isPending && !isError && stages.length === 0;

  return (
    <div className="space-y-6">
      <ModuleHeader
        label="CRM"
        title="Leads"
        description="Track prospects and nurture your sales pipeline."
      />

      {isEmpty ? (
        <EmptyState
          icon={Users}
          title="No pipeline stages"
          description="Your pipeline stages will appear here once created."
        />
      ) : (
        <KanbanBoard />
      )}

      {!isPending && !isError && stages.length > 0 && leads.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted-foreground">
          No leads yet — create your first lead to see it on the board.
        </p>
      ) : null}
    </div>
  );
}
