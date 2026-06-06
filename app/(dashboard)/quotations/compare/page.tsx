import { getQuotationsForRfq } from "@/lib/actions";
import { db } from "@/lib/db";
import { rfqs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/rbac-server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuotationActions } from "@/components/quotations/quotation-actions";
import {
  CompareToolbar,
  type SortValue,
  type StatusFilter,
} from "@/components/quotations/compare-toolbar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const VALID_SORTS: SortValue[] = [
  "default",
  "amount-asc",
  "amount-desc",
  "delivery-asc",
  "delivery-desc",
  "rating-desc",
  "rating-asc",
];
const VALID_STATUSES: StatusFilter[] = ["all", "submitted", "approved", "rejected"];

function parseSort(v: unknown): SortValue {
  return VALID_SORTS.includes(v as SortValue) ? (v as SortValue) : "default";
}
function parseStatus(v: unknown): StatusFilter {
  return VALID_STATUSES.includes(v as StatusFilter) ? (v as StatusFilter) : "all";
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [user, sp] = await Promise.all([requireUser(), (async () => await searchParams)()]);
  const rfqId = Number(sp?.rfqId);
  const sort = parseSort(sp?.sort);
  const status = parseStatus(sp?.status);
  const [rfq] = rfqId ? await db.select().from(rfqs).where(eq(rfqs.id, rfqId)) : [null];
  const allQuotations = rfqId ? await getQuotationsForRfq(rfqId) : [];

  // filter
  const filtered = status === "all" ? allQuotations : allQuotations.filter((q) => q.status === status);

  // sort (stable, never mutate the input)
  const quotations = [...filtered].sort((a, b) => {
    switch (sort) {
      case "amount-asc":
        return (a.grandTotal ?? Infinity) - (b.grandTotal ?? Infinity);
      case "amount-desc":
        return (b.grandTotal ?? -Infinity) - (a.grandTotal ?? -Infinity);
      case "delivery-asc":
        return (a.deliveryDays ?? Infinity) - (b.deliveryDays ?? Infinity);
      case "delivery-desc":
        return (b.deliveryDays ?? -Infinity) - (a.deliveryDays ?? -Infinity);
      case "rating-desc":
        return (b.vendorRating ?? -Infinity) - (a.vendorRating ?? -Infinity);
      case "rating-asc":
        return (a.vendorRating ?? Infinity) - (b.vendorRating ?? Infinity);
      default:
        return 0;
    }
  });

  // lowest-price badge recalculated from the visible (filtered) list
  const lowestTotal = quotations.length > 0
    ? Math.min(...quotations.map((q) => q.grandTotal || Infinity))
    : 0;

  const noRfq = !rfqId;
  const noMatches = rfqId && quotations.length === 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/quotations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Quotation Comparison
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        {rfq?.title ? `RFQ: ${rfq.title}` : "Select an RFQ to compare quotations."} — {allQuotations.length} quotation(s) received
      </p>

      {!noRfq && allQuotations.length > 0 && (
        <CompareToolbar
          sort={sort}
          status={status}
          count={quotations.length}
          total={allQuotations.length}
        />
      )}

      {noRfq && (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Select an RFQ from the <Link href="/quotations" className="text-primary underline">Quotations</Link> page to compare its vendor bids.
          </CardContent>
        </Card>
      )}

      {noMatches && (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No quotations match the current filter.
          </CardContent>
        </Card>
      )}

      {quotations.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Criteria</TableHead>
                  {quotations.map((q) => (
                    <TableHead key={q.id} className="text-xs text-center">
                      {q.vendorName}
                      {q.grandTotal === lowestTotal && (
                        <Badge variant="outline" className="ml-1 text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                          Lowest
                        </Badge>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-sm font-medium">Grand Total</TableCell>
                  {quotations.map((q) => (
                    <TableCell
                      key={q.id}
                      className={`text-sm text-center font-medium ${q.grandTotal === lowestTotal ? "text-emerald-700" : ""}`}
                    >
                      ₹{q.grandTotal?.toLocaleString("en-IN")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-medium">GST %</TableCell>
                  {quotations.map((q) => (
                    <TableCell key={q.id} className="text-sm text-center">{q.gstPercent}%</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-medium">Delivery (days)</TableCell>
                  {quotations.map((q) => (
                    <TableCell key={q.id} className="text-sm text-center">{q.deliveryDays}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-medium">Vendor Rating</TableCell>
                  {quotations.map((q) => (
                    <TableCell key={q.id} className="text-sm text-center">
                      {q.vendorRating > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          ★ {q.vendorRating.toFixed(1)}/5
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-medium">Payment Terms</TableCell>
                  {quotations.map((q) => (
                    <TableCell key={q.id} className="text-sm text-center">{q.paymentTerms}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-medium">Notes</TableCell>
                  {quotations.map((q) => (
                    <TableCell key={q.id} className="text-sm text-center text-muted-foreground max-w-[200px] truncate">
                      {q.notes || "—"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm font-medium">Action</TableCell>
                  {quotations.map((q) => (
                    <TableCell key={q.id} className="text-center">
                      {q.status === "rejected" ? (
                        <span className="text-xs text-muted-foreground italic">Rejected</span>
                      ) : q.status === "approved" ? (
                        <QuotationActions role={user.role} quotationId={q.id} status="approved" />
                      ) : (
                        <QuotationActions role={user.role} quotationId={q.id} status="submitted" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
