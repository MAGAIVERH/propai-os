import type { PropertyImageResponse } from "@propai/shared";

import { presignPropertyImageDownload } from "@/modules/properties/queries/presign-property-image-download";

const MAX_ANALYZE_IMAGE_COUNT = 10;

export async function collectPropertyImageUrls(
  images: PropertyImageResponse[],
): Promise<string[]> {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const selected = sorted.slice(0, MAX_ANALYZE_IMAGE_COUNT);

  const presigned = await Promise.all(
    selected.map((image) => presignPropertyImageDownload(image.storageKey)),
  );

  return presigned.map((item) => item.downloadUrl);
}
