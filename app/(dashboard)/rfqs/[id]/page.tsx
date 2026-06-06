import { notFound } from "next/navigation";
import { getRfqById, sendRfq, getQuotationsForRfq, getVendors, getRfqAttachments } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Send, MessageSquareQuote, Paperclip } from "lucide-react";
import Link from "next/link";
import { Printable } from "@/components/printable";
import { RfqPdfActions } from "./rfq-pdf-actions";
import { RfqAttachments } from "@/components/rfqs/rfq-attachments";
import { format } from "date-fns";

export default async function RfqDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rfq = await getRfqById(Number(id));
  if (!rfq) return notFound();
  const quotations = await getQuotationsForRfq(Number(id));
  const allVendors = await getVendors();
  const assignedVendors = allVendors.filter((v) =>
    rfq.assignedVendorIds?.includes(v.id)
  );
  const attachments = await getRfqAttachments(Number(id));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="no-print flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            {rfq.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            RFQ #{rfq.id} — {rfq.category}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rfq.status === "draft" && (
            <form
              action={async () => {
                "use server";
                await sendRfq(Number(id));
              }}
            >
              <Button type="submit" size="sm">
                <Send className="h-4 w-4 mr-1.5" />
                Send to Vendors
              </Button>
            </form>
          )}
          <Link href={`/rfqs/${id}/quotation`}>
            <Button variant="outline" size="sm">
              <MessageSquareQuote className="h-4 w-4 mr-1.5" />
              Submit Quotation
            </Button>
          </Link>
          <RfqPdfActions
            rfqId={rfq.id}
            title={rfq.title}
            category={rfq.category}
            description={rfq.description}
            status={rfq.status}
            deadline={rfq.deadline}
            createdAt={rfq.createdAt}
            items={rfq.items}
            assignedVendorNames={assignedVendors.map((v) => v.name)}
          />
        </div>
      </div>

      <Printable title={`RFQ ${rfq.id}`}>
        <div className="bg-white p-8 rounded-lg border border-border print:border-0 print:p-0">
          <div className="flex items-start justify-between border-b border-border pb-6 mb-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">
                Your Organization Name
              </h1>
              <p className="text-sm text-muted-foreground mt-1">123 Business Park, Ahmedabad</p>
              <p className="text-sm text-muted-foreground">GSTIN: 25AABCS1429B1Z0</p>
            </div>
            <div className="text-right">
              <h2 className="font-heading text-3xl font-bold text-primary">
                REQUEST FOR QUOTATION
              </h2>
              <p className="text-sm font-mono mt-1">RFQ-{rfq.id}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {new Date(rfq.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Title</p>
              <p className="mt-1 font-medium">{rfq.title}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Category</p>
              <p className="mt-1">{rfq.category}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
              <p className="mt-1 font-medium capitalize">{rfq.status}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Deadline</p>
              <p className="mt-1 font-medium">
                {rfq.deadline ? format(new Date(rfq.deadline), "dd MMM yyyy") : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Vendors</p>
              <p className="mt-1">{assignedVendors.length}</p>
            </div>
          </div>

          {rfq.description && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{rfq.description}</p>
            </div>
          )}

          <Card className="print:border print:shadow-none mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">#</TableHead>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs text-right">Quantity</TableHead>
                    <TableHead className="text-xs text-right">Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfq.items.map((item: { id: number; itemName: string; quantity: number; unit: string }, idx: number) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{idx + 1}</TableCell>
                      <TableCell className="text-sm font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-right">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {assignedVendors.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Assigned Vendors
              </p>
              <ul className="text-sm space-y-1">
                {assignedVendors.map((v) => (
                  <li key={v.id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="font-medium">{v.name}</span>
                    {v.email && (
                      <span className="text-muted-foreground">— {v.email}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-border">
            <div>
              <div className="border-b border-foreground/30 pb-1 mb-1" style={{ minHeight: 40 }} />
              <p className="text-xs text-muted-foreground">Issued By</p>
            </div>
            <div>
              <div className="border-b border-foreground/30 pb-1 mb-1" style={{ minHeight: 40 }} />
              <p className="text-xs text-muted-foreground">Vendor Acceptance Signature</p>
            </div>
          </div>
        </div>
      </Printable>

      {quotations.length > 0 && (
        <Card className="no-print">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg">Quotations Received</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Vendor</TableHead>
                  <TableHead className="text-xs text-right">Grand Total</TableHead>
                  <TableHead className="text-xs">Delivery</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="text-sm font-medium">{q.vendorName}</TableCell>
                    <TableCell className="text-sm text-right">₹{q.grandTotal?.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{q.deliveryDays} days</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {q.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="no-print">
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="font-heading text-lg">Attachments</CardTitle>
          <span className="text-xs text-muted-foreground ml-1">({attachments.length})</span>
        </CardHeader>
        <CardContent>
          <RfqAttachments rfqId={rfq.id} initialAttachments={attachments} />
        </CardContent>
      </Card>
    </div>
  );
}
