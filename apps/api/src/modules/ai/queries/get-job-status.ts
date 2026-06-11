import {
  analyzeImagesJobDataSchema,
  analyzeImagesJobStatusResponseSchema,
  propertyImageAnalysisSchema,
  type AiJobStatus,
  type AnalyzeImagesJobData,
  type AnalyzeImagesJobStatusResponse,
  type PropertyImageAnalysis,
} from "@propai/shared";
import type { Job } from "bullmq";

import { BullMqRedisUnavailableError } from "../../../lib/redis-bullmq.js";
import { getAnalyzeImagesQueue } from "../queues/analyze-images-queue.js";

function normalizeTenantId(tenantId: string): string {
  return tenantId.toLowerCase();
}

export function mapBullMqStateToAiJobStatus(state: string): AiJobStatus {
  switch (state) {
    case "active":
      return "processing";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "waiting":
    case "delayed":
    case "waiting-children":
    case "prioritized":
      return "queued";
    default:
      return "queued";
  }
}

function parseJobResult(returnvalue: unknown): PropertyImageAnalysis | null {
  const parsed = propertyImageAnalysisSchema.safeParse(returnvalue);

  return parsed.success ? parsed.data : null;
}

function buildJobStatusResponse(
  job: Job<AnalyzeImagesJobData>,
  status: AiJobStatus,
): AnalyzeImagesJobStatusResponse {
  const response: AnalyzeImagesJobStatusResponse = {
    jobId: job.id ?? "",
    status,
  };

  if (status === "completed") {
    response.result = parseJobResult(job.returnvalue);
  }

  if (status === "failed") {
    response.failedReason = job.failedReason ?? null;
  }

  return analyzeImagesJobStatusResponseSchema.parse(response);
}

/**
 * Returns tenant-scoped job status, or null when the job is missing
 * or belongs to another organization.
 */
export async function getJobStatus(
  tenantId: string,
  jobId: string,
): Promise<AnalyzeImagesJobStatusResponse | null> {
  const queue = getAnalyzeImagesQueue();

  if (!queue) {
    throw new BullMqRedisUnavailableError();
  }

  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const parsedData = analyzeImagesJobDataSchema.safeParse(job.data);

  if (
    !parsedData.success ||
    parsedData.data.tenantId !== normalizeTenantId(tenantId)
  ) {
    return null;
  }

  const state = await job.getState();
  const status = mapBullMqStateToAiJobStatus(state);

  return buildJobStatusResponse(job, status);
}
