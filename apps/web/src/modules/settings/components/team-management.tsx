"use client";

import type { AssignableRole, TeamMember } from "@propai/shared";
import { Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiClientError } from "@/lib/api-client";

import {
  useChangeMemberRole,
  useInviteMember,
  useRemoveMember,
  useTeam,
} from "../hooks/use-settings";

const ASSIGNABLE: { value: AssignableRole; label: string }[] = [
  { value: "manager", label: "Manager" },
  { value: "agent", label: "Agent" },
  { value: "viewer", label: "Viewer" },
];

function errMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs capitalize">
      {role}
    </span>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const changeRole = useChangeMemberRole();
  const remove = useRemoveMember();
  const isOwner = member.role === "owner";

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{member.name ?? member.email}</span>
          {member.name && <span className="text-muted-foreground text-xs">{member.email}</span>}
        </div>
      </TableCell>
      <TableCell>
        {member.status === "pending" ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-500">
            Pending invite
          </span>
        ) : isOwner ? (
          <RoleBadge role={member.role} />
        ) : (
          <Select
            value={member.role}
            onValueChange={(role) => {
              if (!role) return;
              changeRole.mutate(
                { memberId: member.id, role: role as AssignableRole },
                {
                  onSuccess: () => toast.success("Role updated"),
                  onError: (e) => toast.error(errMessage(e, "Could not update role")),
                },
              );
            }}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TableCell>
      <TableCell className="text-right">
        {member.status === "active" && !isOwner && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove member"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(member.id, {
                onSuccess: () => toast.success("Member removed"),
                onError: (e) => toast.error(errMessage(e, "Could not remove member")),
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function TeamManagement() {
  const team = useTeam();
  const invite = useInviteMember();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>("agent");

  function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    invite.mutate(
      { email: trimmed, role },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${trimmed}`);
          setEmail("");
        },
        onError: (err) => toast.error(errMessage(err, "Could not send invite")),
      },
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={submitInvite}
        className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="invite-email" className="mb-1 block text-sm font-medium">
            Invite a team member
          </label>
          <Input
            id="invite-email"
            type="email"
            placeholder="agent@brokerage.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Select value={role} onValueChange={(r) => r && setRole(r as AssignableRole)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={invite.isPending}>
          <UserPlus className="size-4" />
          {invite.isPending ? "Sending…" : "Invite"}
        </Button>
      </form>

      {team.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : team.isError ? (
        <p className="text-sm text-red-500">Could not load the team.</p>
      ) : (
        <Table className="min-w-[420px]">
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.data.members.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
