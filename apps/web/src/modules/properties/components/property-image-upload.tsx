"use client";

import { UPLOAD_MAX_BYTES, isImageContentType } from "@propai/shared";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PROPERTY_IMAGES_QUERY_KEY } from "@/modules/properties/hooks/use-property-images";
import { getPropertyFormErrorMessage } from "@/modules/properties/lib/property-form-error";
import { uploadFileToPresignedUrl } from "@/modules/properties/lib/upload-file-to-presigned-url";
import { confirmPropertyImage } from "@/modules/properties/queries/confirm-property-image";
import { presignPropertyImage } from "@/modules/properties/queries/presign-property-image";

type PropertyImageUploadProps = {
  propertyId: string;
  nextSortOrder: number;
};

function formatMaxUploadSize(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function PropertyImageUpload({
  propertyId,
  nextSortOrder,
}: PropertyImageUploadProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelectFile() {
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isImageContentType(file.type)) {
      toast.error("Please select an image file (JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > UPLOAD_MAX_BYTES) {
      toast.error(
        `Image must be ${formatMaxUploadSize(UPLOAD_MAX_BYTES)} or smaller.`,
      );
      return;
    }

    startTransition(async () => {
      setUploadProgress(0);

      try {
        const presign = await presignPropertyImage({
          propertyId,
          contentType: file.type,
          contentLength: file.size,
        });

        await uploadFileToPresignedUrl({
          uploadUrl: presign.uploadUrl,
          file,
          headers: presign.headers,
          onProgress: setUploadProgress,
        });

        await confirmPropertyImage(propertyId, {
          objectKey: presign.key,
          mimeType: file.type,
          sizeBytes: file.size,
          sortOrder: nextSortOrder,
        });

        await queryClient.invalidateQueries({
          queryKey: [...PROPERTY_IMAGES_QUERY_KEY, propertyId],
        });

        toast.success("Photo uploaded successfully.");
      } catch (error) {
        toast.error(
          getPropertyFormErrorMessage(
            error,
            "Unable to upload photo. Check that object storage (MinIO/R2) is configured.",
          ),
        );
      } finally {
        setUploadProgress(null);
      }
    });
  }

  const isUploading = isPending || uploadProgress !== null;

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Upload photo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            JPEG, PNG, or WebP — up to {formatMaxUploadSize(UPLOAD_MAX_BYTES)}.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={isUploading}
          onClick={handleSelectFile}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {isUploading ? "Uploading…" : "Choose image"}
        </Button>
      </div>

      {uploadProgress !== null ? (
        <div className="mt-4 space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Uploading… {uploadProgress}%
          </p>
        </div>
      ) : null}
    </div>
  );
}
