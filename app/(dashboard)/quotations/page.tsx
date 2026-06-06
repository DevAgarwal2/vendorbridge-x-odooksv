import Link from "next/link";
import { db } from "@/lib/db";
import { quotations, vendors, rfqs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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

export default async function QuotationsPage() {
  const qs = (await db
    .select({
      id: quotations.id,
      rfqId: quotations.rfqId,
      vendorId: quotations.vendorId,
      grandTotal: quotations.grandTotal,
      deliveryDays: quotations.deliveryDays,
      paymentTerms: quotations.paymentTerms,
      status: quotations.status,
      vendorName: vendors.name,
      rfqTitle: rfqs.title,
    })
    .from(quotations)
    .leftJoin(vendors, eq(quotations.vendorId, vendors.id))
    .leftJoin(rfqs, eq(quotations.rfqId, rfqs.id))
    .orderBy(sql`${quotations.createdAt} desc`)) as {
      id: number; rfqId: number; vendorId: number; grandTotal: number | null;
      deliveryDays: number | null; paymentTerms: string | null; status: string;
      vendorName: string | null; rfqTitle: string | null;
    }[];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Quotations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and compare vendor quotations.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">RFQ</TableHead>
                <TableHead className="text-xs">Vendor</TableHead>
                <TableHead className="text-xs text-right">Grand Total</TableHead>
                <TableHead className="text-xs">Delivery</TableHead>
                <TableHead className="text-xs">Payment Terms</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qs.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="text-sm font-medium">{q.rfqTitle}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.vendorName}</TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    ₹{q.grandTotal?.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.deliveryDays} days</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.paymentTerms}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        q.status === "approved"
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : q.status === "submitted"
                          ? "border-sky-200 text-sky-700 bg-sky-50"
                          : q.status === "rejected"
                          ? "border-red-200 text-red-700 bg-red-50"
                          : "border-slate-200 text-slate-700 bg-slate-50"
                      }`}
                    >
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/quotations/compare?rfqId=${q.rfqId}`}>
                      <Button variant="ghost" size="sm">
                        Compare
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {qs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No quotations yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
