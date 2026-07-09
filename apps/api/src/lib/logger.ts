import { randomUUID } from "node:crypto";

import type { FastifyServerOptions } from "fastify";

export function getFastifyLoggerConfig(
  enabled: boolean,
): FastifyServerOptions["logger"] {
  if (!enabled) {
    return false;
  }

  const isDev = process.env.NODE_ENV !== "production";

  return {
    level: process.env.LOG_LEVEL ?? "info",
    // Never let credentials reach the logs. Fastify serializes req/res headers,
    // which would otherwise expose session cookies and bearer tokens.
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        'res.headers["set-cookie"]',
      ],
      censor: "[redacted]",
    },
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  };
}

export const requestIdOptions = {
  requestIdHeader: "x-request-id",
  genReqId: (request: { headers: Record<string, string | string[] | undefined> }) => {
    const header = request.headers["x-request-id"];
    if (typeof header === "string" && header.length > 0) {
      return header;
    }
    return randomUUID();
  },
} satisfies Pick<FastifyServerOptions, "requestIdHeader" | "genReqId">;
