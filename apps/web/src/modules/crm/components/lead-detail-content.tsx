"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LeadActivityListResponse, LeadResponse } from "@propai/shared";
import {
  ArrowRight,
  Calendar,
  FileText,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { deleteLead } from "@/modules/crm/queries/delete-lead";
import { LEADS_QUERY_KEY } from "@/modules/crm/hooks/use-kanban";
import { createLeadActivity } from "@/modules/crm/queries/create-lead-activity";
import { getLeadActivities } from "@/modules/crm/queries/get-lead-activities";
import { moveLeadStage } from "@/modules/crm/queries/move-lead-stage";
import { getPipelineStages } from "@/modules/crm/queries/get-pipeline-stages";
import { PIPELINE_STAGES_QUERY_KEY } from "@/modules/crm/hooks/use-kanban";

const ACTIVITY_META = {
  note: { label: "Note", icon: FileText, color: "text-blue-500" },
  call: { label: "Call", icon: Phone, color: "text-green-500" },
  email: { label: "Email", icon: Mail, color: "text-purple-500" },
  stage_change: { label: "Stage change", icon: ArrowRight, color: "text-orange-500" },
  visit_scheduled: { label: "Visit", icon: Calendar, color: "text-teal-500" },
} as const;

const ADD_ACTIVITY_TYPES = ["note", "call", "email", "visit_scheduled"] as const;
type AddActivityType = (typeof ADD_ACTIVITY_TYPES)[number];

function aiScoreBar(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-muted-foreground";
}

function aiScoreText(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-muted-foreground";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Props = {
  lead: LeadResponse;
  initialActivities: LeadActivityListResponse;
};

export function LeadDetailContent({ lead, initialActivities }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const ACTIVITIES_KEY = ["lead-activities", lead.id] as const;

  const [activityType, setActivityType] = useState<AddActivityType>("note");
  const [content, setContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const activitiesQuery = useQuery({
    queryKey: ACTIVITIES_KEY,
    queryFn: () => getLeadActivities(lead.id),
    initialData: initialActivities,
  });

  const stagesQuery = useQuery({
    queryKey: PIPELINE_STAGES_QUERY_KEY,
    queryFn: getPipelineStages,
    staleTime: 5 * 60 * 1000,
  });

  const lostStage = stagesQuery.data?.stages.find((s) => s.isLost) ?? null;
  const isAlreadyLost = !!lostStage && lead.stageId === lostStage.id;

  const addActivityMutation = useMutation({
    mutationFn: (input: { type: AddActivityType; content: string }) =>
      createLeadActivity(lead.id, input),
    onSuccess: (newActivity) => {
      queryClient.setQueryData<LeadActivityListResponse>(ACTIVITIES_KEY, (old) =>
        old
          ? { activities: [...old.activities, newActivity] }
          : { activities: [newActivity] },
      );
      setContent("");
      toast.success("Activity saved.");
    },
    onError: () => toast.error("Failed to save activity."),
  });

  const markLostMutation = useMutation({
    mutationFn: () => {
      if (!lostStage) throw new Error("Lost stage not found.");
      return moveLeadStage(lead.id, lostStage.id);
    },
    onSuccess: () => toast.success("Lead marked as lost."),
    onError: () => toast.error("Failed to mark lead as lost."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(lead.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead deleted.");
      router.push("/leads");
    },
    onError: () => {
      toast.error("Failed to delete lead.");
      setDeleteDialogOpen(false);
    },
  });

  const activities = activitiesQuery.data?.activities ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar: contact info + actions */}
      <aside className="flex flex-col gap-4">
        {/* Contact */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Contact
          </p>
          <dl className="space-y-2.5">
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd>
                <a
                  href={`mailto:${lead.email}`}
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {lead.email}
                </a>
              </dd>
            </div>
            {lead.phone ? (
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd>
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {lead.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {lead.source ? (
              <div>
                <dt className="text-xs text-muted-foreground">Source</dt>
                <dd className="text-sm text-foreground">{lead.source}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="text-sm text-foreground">{formatDate(lead.createdAt)}</dd>
            </div>
          </dl>
        </section>

        {/* AI Score */}
        {lead.aiScore != null ? (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              AI Score
            </p>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-4xl font-bold tabular-nums",
                  aiScoreText(lead.aiScore),
                )}
              >
                {lead.aiScore}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", aiScoreBar(lead.aiScore))}
                style={{ width: `${lead.aiScore}%` }}
              />
            </div>
          </section>
        ) : null}

        {/* Property link */}
        {lead.propertyId ? (
          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Property
            </p>
            <Button
              variant="outline"
              className="w-full rounded-xl text-sm"
              render={<Link href={`/properties/${lead.propertyId}`} />}
            >
              View property
            </Button>
          </section>
        ) : null}

        {/* Notes */}
        {lead.notes ? (
          <section className="space-y-2 rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Notes
            </p>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
              {lead.notes}
            </p>
          </section>
        ) : null}

        {/* Actions */}
        <section className="space-y-2.5 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Actions
          </p>
          <Button
            variant="outline"
            className="w-full rounded-xl text-sm border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => markLostMutation.mutate()}
            disabled={
              markLostMutation.isPending ||
              !lostStage ||
              isAlreadyLost
            }
          >
            {markLostMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            {isAlreadyLost ? "Already marked as Lost" : "Mark as Lost"}
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl text-sm"
            render={<Link href="/leads" />}
          >
            Back to Pipeline
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-xl text-sm text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Lead
          </Button>
        </section>
      </aside>

      {/* Main: log activity + timeline */}
      <main className="flex flex-col gap-6">
        {/* Log activity */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Log Activity
          </p>

          <div className="flex flex-wrap gap-2">
            {ADD_ACTIVITY_TYPES.map((type) => {
              const meta = ACTIVITY_META[type];
              const Icon = meta.icon;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    activityType === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3" />
                  {meta.label}
                </button>
              );
            })}
          </div>

          <textarea
            className="min-h-24 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={`Add a ${ACTIVITY_META[activityType].label.toLowerCase()} note…`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <Button
            className="rounded-xl"
            disabled={!content.trim() || addActivityMutation.isPending}
            onClick={() =>
              addActivityMutation.mutate({ type: activityType, content: content.trim() })
            }
          >
            {addActivityMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </section>

        {/* Activity timeline */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Timeline
          </p>

          {activitiesQuery.isPending ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={`act-sk-${i}`} className="flex gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activities yet. Log the first one above.
            </p>
          ) : (
            <ol className="space-y-0">
              {[...activities].reverse().map((activity, idx, arr) => {
                const meta = ACTIVITY_META[activity.type];
                const Icon = meta.icon;
                const isLast = idx === arr.length - 1;

                return (
                  <li key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted",
                          meta.color,
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      {!isLast ? (
                        <div className="my-1 w-px flex-1 bg-border" />
                      ) : null}
                    </div>
                    <div className={cn("flex flex-col gap-0.5", isLast ? "pb-0" : "pb-4")}>
                      <p className="text-xs text-muted-foreground">
                        {meta.label} · {formatDate(activity.createdAt)}
                      </p>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {activity.content}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete lead?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <strong>
                {lead.firstName} {lead.lastName}
              </strong>{" "}
              and all their activity history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="rounded-xl" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
