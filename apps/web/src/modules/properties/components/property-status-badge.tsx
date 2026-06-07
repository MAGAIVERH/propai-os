import { Badge } from "@/components/ui/badge";
import type { PropertyStatus } from "@propai/shared";

type PropertyStatusBadgeProps = {
  status: PropertyStatus;
  label: string;
};

export function getStatusBadgeVariant(
  status: PropertyStatus,
): "default" | "secondary" | "outline" {
  if (status === "active") {
    return "default";
  }

  if (status === "draft") {
    return "secondary";
  }

  return "outline";
}

export function PropertyStatusBadge({ status, label }: PropertyStatusBadgeProps) {
  return <Badge variant={getStatusBadgeVariant(status)}>{label}</Badge>;
}
