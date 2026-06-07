"use client";

import type { PropertyImageResponse } from "@propai/shared";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { presignPropertyImageDownload } from "@/modules/properties/queries/presign-property-image-download";

type PropertyGalleryProps = {
  images: PropertyImageResponse[];
};

type PropertyGalleryImageProps = {
  image: PropertyImageResponse;
  index: number;
};

function PropertyGalleryImage({ image, index }: PropertyGalleryImageProps) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["uploads", "presign-download", image.storageKey],
    queryFn: () => presignPropertyImageDownload(image.storageKey),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="overflow-hidden rounded-2xl border-border py-0 ring-0">
      <CardContent className="p-0">
        {isPending ? (
          <div className="flex aspect-video items-center justify-center bg-muted">
            <ImageIcon className="size-6 text-muted-foreground" />
          </div>
        ) : null}

        {isError || (!isPending && !data) ? (
          <div className="flex aspect-video items-center justify-center bg-muted px-4 text-center">
            <p className="text-xs text-muted-foreground">
              Não foi possível carregar esta foto.
            </p>
          </div>
        ) : null}

        {!isPending && data ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.downloadUrl}
            alt={`Foto ${index + 1} do imóvel`}
            className="aspect-video w-full object-cover"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ImageIcon className="size-4" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          Nenhuma foto cadastrada
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie a primeira imagem usando o botão acima.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <PropertyGalleryImage key={image.id} image={image} index={index} />
      ))}
    </div>
  );
}
