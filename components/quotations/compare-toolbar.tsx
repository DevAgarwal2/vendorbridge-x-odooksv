"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownAZ, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SORT_OPTIONS = [
  { value: "default", label: "Default order" },
  { value: "amount-asc", label: "Amount — low to high" },
  { value: "amount-desc", label: "Amount — high to low" },
  { value: "delivery-asc", label: "Delivery — fastest first" },
  { value: "delivery-desc", label: "Delivery — slowest first" },
  { value: "rating-desc", label: "Vendor rating — best first" },
  { value: "rating-asc", label: "Vendor rating — worst first" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
export type StatusFilter = "all" | "submitted" | "approved" | "rejected";

const STATUS_PILLS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function CompareToolbar({
  sort,
  status,
  count,
  total,
}: {
  sort: SortValue;
  status: StatusFilter;
  count: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "" || v === "default" || v === "all") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
        {STATUS_PILLS.map((p) => {
          const active = status === p.value;
          return (
            <Button
              key={p.value}
              size="sm"
              variant={active ? "default" : "outline"}
              className="h-7 px-2.5 text-xs"
              onClick={() => pushParams({ status: p.value === "all" ? null : p.value })}
            >
              {p.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {count !== total && (
          <span className="text-xs text-muted-foreground">
            Showing {count} of {total}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
          <Select
            value={sort}
            onValueChange={(v) => pushParams({ sort: v === "default" ? null : (v as string) })}
          >
            <SelectTrigger className="h-7 w-[220px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
