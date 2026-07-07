"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SESSION_QUERY_KEY, useSessionQuery } from "@/hooks/use-session";
import { changePassword, updateUserProfile } from "@/lib/auth-client";
import { getAuthFormErrorMessage } from "@/modules/auth/lib/auth-form-error";
import type { AuthUser } from "@/types/auth";

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? email.slice(0, 2)).toUpperCase();
}

function ProfilePanels({ user }: { user: AuthUser }) {
  const queryClient = useQueryClient();

  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    try {
      await updateUserProfile({ name: name.trim(), image: image.trim() || null });
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(getAuthFormErrorMessage(error, "Couldn't update your profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed.");
    } catch (error) {
      toast.error(getAuthFormErrorMessage(error, "Couldn't change your password."));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <span className="bg-primary text-primary-foreground flex size-14 items-center justify-center overflow-hidden rounded-full text-lg font-semibold ring-2 ring-white/70 dark:ring-white/10">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(name || user.name || "", user.email)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{name || user.name}</p>
              <p className="text-muted-foreground truncate text-sm">{user.email}</p>
            </div>
          </div>

          <form onSubmit={onSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image">Avatar URL (optional)</Label>
              <Input
                id="image"
                type="url"
                placeholder="https://…"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} readOnly disabled />
              <p className="text-muted-foreground text-xs">
                Email changes aren&apos;t available here yet — contact support.
              </p>
            </div>
            <Button type="submit" disabled={savingProfile} className="rounded-lg">
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={savingPassword} className="rounded-lg">
              {savingPassword ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileContent() {
  const { data: session, isPending } = useSessionQuery();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="Manage your personal account — name, avatar, and password."
        back={{ label: "Dashboard", href: "/dashboard" }}
      />
      {isPending || !user ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      ) : (
        <ProfilePanels key={user.id} user={user} />
      )}
    </div>
  );
}
