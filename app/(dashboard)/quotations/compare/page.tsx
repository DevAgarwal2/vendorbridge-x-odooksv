import { getQuotationsForRfq } from "@/lib/actions";
import { db } from "@/lib/db";
import { rfqs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
import { approveQuotation, createPurchaseOrderFromQuotation } from "@/lib/actions";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const rfqId = Number(sp?.rfqId);
  const [rfq] = rfqId ? await db.select().from(rfqs).where(eq(rfqs.id, rfqId)) : [null];
  const quotations = rfqId ? await getQuotationsForRfq(rfqId) : [];

  const lowestTotal = quotations.length > 0
    ? Math.min(...quotations.map((q) => q.grandTotal || Infinity))
    : 0;

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
        {rfq?.title ? `RFQ: ${rfq.title}` : "Select an RFQ to compare quotations."} — {quotations.length} quotation(s) received
      </p>

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
                  <TableCell key={q.id} className={`text-sm text-center font-medium ${q.grandTotal === lowestTotal ? "text-emerald-700" : ""}`}>
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
                    {q.status === "submitted" ? (
                      <form
                        action={async () => {
                          "use server";
                          await approveQuotation(q.id);
                          await createPurchaseOrderFromQuotation(q.id);
                        }}
                      >
                        <Button type="submit" size="sm">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Select & Approve
                        </Button>
                      </form>
                    ) : q.status === "approved" ? (
                      <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                        Approved
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
