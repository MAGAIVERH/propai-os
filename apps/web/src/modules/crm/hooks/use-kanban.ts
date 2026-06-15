"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LeadListResponse, LeadResponse } from "@propai/shared";

import { getLeads } from "@/modules/crm/queries/get-leads";
import { getPipelineStages } from "@/modules/crm/queries/get-pipeline-stages";
import { moveLeadStage } from "@/modules/crm/queries/move-lead-stage";

export const PIPELINE_STAGES_QUERY_KEY = ["pipeline-stages"] as const;
export const LEADS_QUERY_KEY = ["leads", "all"] as const;

export function useKanban() {
  const queryClient = useQueryClient();

  const stagesQuery = useQuery({
    queryKey: PIPELINE_STAGES_QUERY_KEY,
    queryFn: getPipelineStages,
  });

  const leadsQuery = useQuery({
    queryKey: LEADS_QUERY_KEY,
    queryFn: getLeads,
  });

  const leadsByStage = useMemo<Map<string | null, LeadResponse[]>>(() => {
    const map = new Map<string | null, LeadResponse[]>();

    for (const lead of leadsQuery.data?.leads ?? []) {
      const key = lead.stageId ?? null;
      const existing = map.get(key);

      if (existing) {
        existing.push(lead);
      } else {
        map.set(key, [lead]);
      }
    }

    return map;
  }, [leadsQuery.data]);

  const moveMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      moveLeadStage(leadId, stageId),

    onMutate: async ({ leadId, stageId }) => {
      await queryClient.cancelQueries({ queryKey: LEADS_QUERY_KEY });

      const previous = queryClient.getQueryData<LeadListResponse>(LEADS_QUERY_KEY);

      queryClient.setQueryData<LeadListResponse>(LEADS_QUERY_KEY, (old) => {
        if (!old) return old;

        return {
          ...old,
          leads: old.leads.map((lead) =>
            lead.id === leadId ? { ...lead, stageId } : lead,
          ),
        };
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(LEADS_QUERY_KEY, ctx.previous);
      }

      toast.error("Failed to move lead. Please try again.");
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
  });

  return {
    stages: stagesQuery.data?.stages ?? [],
    leads: leadsQuery.data?.leads ?? [],
    leadsByStage,
    isPending: stagesQuery.isPending || leadsQuery.isPending,
    isError: stagesQuery.isError || leadsQuery.isError,
    moveLead: (leadId: string, stageId: string) =>
      moveMutation.mutate({ leadId, stageId }),
  };
}
