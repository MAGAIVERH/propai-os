"use client";

import type { TenantSettingsResponse } from "@propai/shared";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";

import { useTenantSettings, useUpdateTenantSettings } from "../hooks/use-settings";

const US_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

function Form({ initial }: { initial: TenantSettingsResponse }) {
  const update = useUpdateTenantSettings();
  const [agencyName, setAgencyName] = useState(initial.agencyName);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [marketplaceSlug, setMarketplaceSlug] = useState(initial.marketplaceSlug ?? "");

  function save(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(
      {
        agencyName: agencyName.trim() || undefined,
        timezone,
        primaryColor,
        logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
        marketplaceSlug: marketplaceSlug.trim() ? marketplaceSlug.trim() : null,
      },
      {
        onSuccess: () => toast.success("Settings saved"),
        onError: (err) =>
          toast.error(err instanceof ApiClientError ? err.message : "Could not save settings"),
      },
    );
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="agency-name">Agency name</Label>
        <Input
          id="agency-name"
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          placeholder="Summit Realty"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={timezone} onValueChange={(v) => setTimezone(v ?? timezone)}>
          <SelectTrigger id="timezone" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {US_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz.replace("America/", "").replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary-color">Brand color</Label>
        <div className="flex items-center gap-3">
          <input
            id="primary-color"
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="border-border h-10 w-14 cursor-pointer rounded-lg border bg-transparent"
          />
          <Input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-32 font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo-url">Logo URL</Label>
        <Input
          id="logo-url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://cdn.example.com/logo.png"
        />
        <p className="text-muted-foreground text-xs">Shown on your marketplace listings.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="marketplace-slug">Marketplace slug</Label>
        <div className="flex items-center gap-2">
          <Input
            id="marketplace-slug"
            value={marketplaceSlug}
            onChange={(e) => setMarketplaceSlug(e.target.value)}
            placeholder="summit-realty"
            className="font-mono"
          />
          <span className="text-muted-foreground text-sm whitespace-nowrap">.propai.io</span>
        </div>
      </div>

      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function GeneralSettingsForm() {
  const settings = useTenantSettings();

  if (settings.isPending) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (settings.isError || !settings.data) {
    return <p className="text-sm text-red-500">Could not load settings.</p>;
  }

  // Remount the form when settings change so useState initializers re-run.
  return <Form key={settings.data.organizationId} initial={settings.data} />;
}
