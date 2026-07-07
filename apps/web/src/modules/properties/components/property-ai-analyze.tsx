"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  usePropertyImageAnalysis,
  type PropertyImageAnalysisStatus,
} from "@/modules/properties/hooks/use-property-image-analysis";
import { usePropertyImagesQuery } from "@/modules/properties/hooks/use-property-images";
import { writeAiPropertyPrefill } from "@/modules/properties/lib/ai-prefill-storage";
import { mapAiAnalysisToFormValues } from "@/modules/properties/lib/map-ai-analysis-to-form";
import { getPropertyFormErrorMessage } from "@/modules/properties/lib/property-form-error";
import { collectPropertyImageUrls } from "@/modules/properties/queries/collect-property-image-urls";

const AI_DISCLAIMER =
  "AI-generated content — please review before publishing.";

type PropertyAiAnalyzeProps = {
  propertyId: string;
};

function getStatusBadgeLabel(status: PropertyImageAnalysisStatus): string | null {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return null;
  }
}

function getStatusBadgeVariant(
  status: PropertyImageAnalysisStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "failed":
      return "destructive";
    case "completed":
      return "outline";
    case "processing":
      return "default";
    default:
      return "secondary";
  }
}

export function PropertyAiAnalyze({ propertyId }: PropertyAiAnalyzeProps) {
  const router = useRouter();
  const { data: images = [] } = usePropertyImagesQuery(propertyId);
  const [isPreparing, startPrepare] = useTransition();
  const {
    status,
    result,
    errorMessage,
    isPending,
    startAnalysis,
    reset,
  } = usePropertyImageAnalysis();

  const hasImages = images.length > 0;
  const isAnalyzing =
    isPreparing ||
    isPending ||
    status === "submitting" ||
    status === "queued" ||
    status === "processing";
  const statusLabel = getStatusBadgeLabel(status);

  function handleAnalyze() {
    if (!hasImages || isAnalyzing) {
      return;
    }

    startPrepare(async () => {
      try {
        const imageUrls = await collectPropertyImageUrls(images);
        startAnalysis(imageUrls);
      } catch (error) {
        toast.error(
          getPropertyFormErrorMessage(
            error,
            "Unable to prepare photos for analysis.",
          ),
        );
      }
    });
  }

  function handleApply() {
    if (!result) {
      return;
    }

    const prefill = mapAiAnalysisToFormValues(result);
    writeAiPropertyPrefill(propertyId, prefill);
    toast.success("AI suggestions saved. Review the form before publishing.");
    router.push(`/properties/${propertyId}/edit`);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Sparkles className="text-primary size-4" aria-hidden="true" />
            AI photo analysis
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate listing suggestions from uploaded photos.
          </p>
        </div>
        {statusLabel ? (
          <Badge variant={getStatusBadgeVariant(status)}>{statusLabel}</Badge>
        ) : null}
      </div>

      <Alert className="rounded-xl border-primary/30 bg-primary/5">
        <AlertTitle className="text-foreground">Review before publishing</AlertTitle>
        <AlertDescription>{AI_DISCLAIMER}</AlertDescription>
      </Alert>

      {status === "failed" && errorMessage ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>
            {errorMessage} You can still fill in the property details manually
            using the edit form.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="rounded-xl"
          disabled={!hasImages || isAnalyzing}
          onClick={handleAnalyze}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {status === "queued"
                ? "Queued…"
                : status === "processing"
                  ? "Processing…"
                  : "Analyzing…"}
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Analyze photos with AI
            </>
          )}
        </Button>

        {status === "completed" && result ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={handleApply}
          >
            Apply suggestions to form
          </Button>
        ) : null}

        {status === "failed" ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={reset}
          >
            Try again
          </Button>
        ) : null}
      </div>

      {!hasImages ? (
        <p className="text-sm text-muted-foreground">
          Upload at least one photo to run AI analysis.
        </p>
      ) : null}
    </div>
  );
}
