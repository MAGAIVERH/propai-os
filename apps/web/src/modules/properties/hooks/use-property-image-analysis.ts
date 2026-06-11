"use client";

import type { PropertyImageAnalysis } from "@propai/shared";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import { getPropertyFormErrorMessage } from "@/modules/properties/lib/property-form-error";
import { analyzePropertyImages } from "@/modules/properties/queries/analyze-property-images";
import { getAnalyzeJobStatus } from "@/modules/properties/queries/get-analyze-job-status";

export type PropertyImageAnalysisStatus =
  | "idle"
  | "submitting"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_DURATION_MS = 3 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mapJobStatusToUiStatus(
  jobStatus: "queued" | "processing" | "completed" | "failed",
): PropertyImageAnalysisStatus {
  if (jobStatus === "completed") {
    return "completed";
  }

  if (jobStatus === "failed") {
    return "failed";
  }

  if (jobStatus === "processing") {
    return "processing";
  }

  return "queued";
}

export function usePropertyImageAnalysis() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<PropertyImageAnalysisStatus>("idle");
  const [result, setResult] = useState<PropertyImageAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
  }, []);

  const startAnalysis = useCallback(
    (imageUrls: string[]) => {
      startTransition(async () => {
        setStatus("submitting");
        setResult(null);
        setErrorMessage(null);

        try {
          const response = await analyzePropertyImages(imageUrls);

          if (response.kind === "immediate") {
            setResult(response.analysis);
            setStatus("completed");
            return;
          }

          setStatus("queued");

          const deadline = Date.now() + MAX_POLL_DURATION_MS;

          while (Date.now() < deadline) {
            await sleep(POLL_INTERVAL_MS);

            const jobStatus = await getAnalyzeJobStatus(response.jobId);
            setStatus(mapJobStatusToUiStatus(jobStatus.status));

            if (jobStatus.status === "completed") {
              if (!jobStatus.result) {
                throw new Error("Analysis completed but no result was returned.");
              }

              setResult(jobStatus.result);
              setStatus("completed");
              return;
            }

            if (jobStatus.status === "failed") {
              throw new Error(jobStatus.failedReason ?? "AI analysis failed.");
            }
          }

          throw new Error("Analysis timed out. Please try again.");
        } catch (error) {
          const message = getPropertyFormErrorMessage(
            error,
            error instanceof Error
              ? error.message
              : "Unable to analyze photos. Please try again.",
          );

          setStatus("failed");
          setErrorMessage(message);
          toast.error(message);
        }
      });
    },
    [startTransition],
  );

  return {
    status,
    result,
    errorMessage,
    isPending,
    startAnalysis,
    reset,
  };
}
