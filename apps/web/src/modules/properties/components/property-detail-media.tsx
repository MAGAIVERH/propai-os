"use client";

import type { PropertyImageResponse } from "@propai/shared";

import { PropertyGallery } from "@/modules/properties/components/property-gallery";
import { PropertyImageUpload } from "@/modules/properties/components/property-image-upload";
import { usePropertyImagesQuery } from "@/modules/properties/hooks/use-property-images";

type PropertyDetailMediaProps = {
  propertyId: string;
  initialImages: PropertyImageResponse[];
};

export function PropertyDetailMedia({
  propertyId,
  initialImages,
}: PropertyDetailMediaProps) {
  const { data: images = initialImages } = usePropertyImagesQuery(propertyId, {
    initialData: initialImages,
  });
  const nextSortOrder =
    images.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          Photos
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">Gallery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload listing photos here. Files go directly to secure storage via a
          presigned URL — this is separate from the create/edit form.
        </p>
      </div>

      <PropertyImageUpload
        propertyId={propertyId}
        nextSortOrder={nextSortOrder}
      />
      <PropertyGallery images={images} />
    </section>
  );
}
