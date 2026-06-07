import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SKELETON_ROW_COUNT = 5;

export function PropertiesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted hover:bg-muted">
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Property
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Address
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Location
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Price
            </TableHead>
            <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <TableRow key={`property-skeleton-${index}`} className="border-border">
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="px-6 py-4">
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="px-6 py-4">
                <Skeleton className="h-5 w-16 rounded-4xl" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
