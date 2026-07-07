"use client";

import { Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { usePropertyImagesQuery } from "@/modules/properties/hooks/use-property-images";
import { presignPropertyImageDownload } from "@/modules/properties/queries/presign-property-image-download";

/**
 * Primary-photo thumbnail for a property, resolved via a presigned download URL.
 * Falls back to a building glyph while loading or when a listing has no photos.
 */
export function PropertyThumb({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const { data: images } = usePropertyImagesQuery(propertyId);
  const primary = images?.find((image) => image.isPrimary) ?? images?.[0];

  const presign = useQuery({
    queryKey: ["property-thumb", primary?.storageKey],
    queryFn: () => presignPropertyImageDownload(primary!.storageKey),
    enabled: Boolean(primary?.storageKey),
    staleTime: 4 * 60 * 1000,
  });

  return (
    <div
      className={cn(
        "bg-muted flex shrink-0 items-center justify-center overflow-hidden rounded-lg",
        className,
      )}
    >
      {presign.data?.downloadUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={presign.data.downloadUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <Building2 className="text-muted-foreground/50 size-5" aria-hidden="true" />
      )}
    </div>
  );
}
