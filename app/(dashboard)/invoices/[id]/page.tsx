import { notFound } from "next/navigation";
import { getInvoiceById, markInvoicePaid } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printable } from "@/components/printable";
import { CheckCircle } from "lucide-react";
import { InvoicePdfActions } from "./invoice-pdf-actions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getInvoiceById(Number(id));
  if (!inv) return notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="no-print flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Invoice
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {inv.invoiceNumber} — PO {inv.poNumber}
          </p>
        </div>
        <InvoicePdfActions
          invoiceNumber={inv.invoiceNumber}
          poNumber={inv.poNumber || ""}
          status={inv.status}
          createdAt={inv.createdAt}
          dueDate={inv.dueDate}
          paidAt={inv.paidAt}
          vendor={inv.vendor}
          items={inv.items}
          subtotal={inv.subtotal}
          cgst={inv.cgst}
          sgst={inv.sgst}
          grandTotal={inv.grandTotal}
        />
      </div>

      <div className="no-print flex items-center gap-2">
        {inv.status === "pending_payment" && (
          <form
            action={async () => {
              "use server";
              await markInvoicePaid(Number(id));
            }}
          >
            <Button type="submit" size="sm">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Mark as Paid
            </Button>
          </form>
        )}
      </div>

      <Printable title={`Invoice ${inv.invoiceNumber}`}>
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
              <h2 className="font-heading text-3xl font-bold text-primary">TAX INVOICE</h2>
              <p className="text-sm font-mono mt-1">{inv.invoiceNumber}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {new Date(inv.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Bill To</p>
              <p className="font-medium">Your Organization Name</p>
              <p className="text-sm text-muted-foreground">123 Business Park, Ahmedabad</p>
              <p className="text-sm text-muted-foreground">GSTIN: 25AABCS1429B1Z0</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Vendor (Bill From)</p>
              <p className="font-medium">{inv.vendor?.name || "—"}</p>
              <p className="text-sm text-muted-foreground">{inv.vendor?.address || "—"}</p>
              <p className="text-sm text-muted-foreground">
                GSTIN: {inv.vendor?.gstNumber || "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">PO Reference</p>
              <p className="font-mono mt-1">{inv.poNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Due Date</p>
              <p className="mt-1">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
              <p className="mt-1 font-medium capitalize">
                {inv.status}
                {inv.status === "paid" && inv.paidAt && (
                  <span className="text-emerald-600 ml-1">
                    ({new Date(inv.paidAt).toLocaleDateString("en-IN")})
                  </span>
                )}
              </p>
            </div>
          </div>

          <Card className="print:border print:shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-xs text-right">Qty</TableHead>
                    <TableHead className="text-xs text-right">Unit Price</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inv.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-sm text-right">{item.quantity}</TableCell>
                      <TableCell className="text-sm text-right">₹{item.unitPrice?.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-sm text-right font-medium">₹{item.total?.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{inv.subtotal?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST (9%)</span>
                <span>₹{inv.cgst?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST (9%)</span>
                <span>₹{inv.sgst?.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <span>Grand Total</span>
                <span>₹{inv.grandTotal?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </Printable>
    </div>
  );
}
