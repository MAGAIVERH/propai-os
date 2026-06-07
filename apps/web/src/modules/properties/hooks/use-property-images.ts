"use client";

import type { PropertyImageResponse } from "@propai/shared";
import { useQuery } from "@tanstack/react-query";

import { getPropertyImages } from "@/modules/properties/queries/get-property-images";

export const PROPERTY_IMAGES_QUERY_KEY = ["properties", "images"] as const;

type UsePropertyImagesQueryOptions = {
  initialData?: PropertyImageResponse[];
};

export function usePropertyImagesQuery(
  propertyId: string,
  options?: UsePropertyImagesQueryOptions,
) {
  return useQuery({
    queryKey: [...PROPERTY_IMAGES_QUERY_KEY, propertyId],
    queryFn: () => getPropertyImages(propertyId),
    initialData: options?.initialData,
  });
}
