import { notFound } from "next/navigation";
import { getPurchaseOrderById } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printable } from "@/components/printable";
import { PoPdfActions } from "./po-pdf-actions";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const po = await getPurchaseOrderById(Number(id));
  if (!po) return notFound();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="no-print flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Purchase Order
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{po.poNumber}</p>
        </div>
        <PoPdfActions
          poNumber={po.poNumber}
          status={po.status}
          createdAt={po.createdAt}
          dueDate={po.dueDate}
          vendor={po.vendor}
          items={po.items}
          subtotal={po.subtotal}
          cgst={po.cgst}
          sgst={po.sgst}
          grandTotal={po.grandTotal}
        />
      </div>

      <Printable title={`Purchase Order ${po.poNumber}`}>
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
              <h2 className="font-heading text-3xl font-bold text-primary">PURCHASE ORDER</h2>
              <p className="text-sm font-mono mt-1">{po.poNumber}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Date: {new Date(po.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Vendor</p>
              <p className="font-medium">{po.vendor?.name || "—"}</p>
              <p className="text-sm text-muted-foreground">{po.vendor?.address || "—"}</p>
              <p className="text-sm text-muted-foreground">
                GSTIN: {po.vendor?.gstNumber || "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Status</p>
              <p className="font-medium capitalize">{po.status}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Due: {po.dueDate ? new Date(po.dueDate).toLocaleDateString("en-IN") : "—"}
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
                  {po.items.map((item: { id: number; itemName: string; quantity: number; unitPrice: number; total: number }) => (
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
                <span>₹{po.subtotal?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST (9%)</span>
                <span>₹{po.cgst?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST (9%)</span>
                <span>₹{po.sgst?.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                <span>Grand Total</span>
                <span>₹{po.grandTotal?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-border">
            <div>
              <div className="border-b border-foreground/30 pb-1 mb-1" style={{ minHeight: 40 }} />
              <p className="text-xs text-muted-foreground">Authorized Signatory (Buyer)</p>
            </div>
            <div>
              <div className="border-b border-foreground/30 pb-1 mb-1" style={{ minHeight: 40 }} />
              <p className="text-xs text-muted-foreground">Vendor Signature & Stamp</p>
            </div>
          </div>
        </div>
      </Printable>
    </div>
  );
}
