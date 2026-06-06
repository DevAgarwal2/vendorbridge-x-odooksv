"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { getRfqById, submitQuotation } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type QuoteItem = { itemName: string; quantity: number; unitPrice: number; total: number };

export default function SubmitQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const rfqId = Number(id);
  const [rfq, setRfq] = useState<any>(null);
  const [items, setItems] = useState<QuoteItem[]>([
    { itemName: "", quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [gstPercent, setGstPercent] = useState(18);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [paymentTerms, setPaymentTerms] = useState("30 days");
  const [notes, setNotes] = useState("");
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadRfq() {
    const data = await getRfqById(rfqId);
    setRfq(data);
    if (data?.items) {
      setItems(
        data.items.map((item: any) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: 0,
          total: 0,
        }))
      );
    }
    if (data?.assignedVendorIds?.length) {
      setVendorId(data.assignedVendorIds[0]);
    }
  }

  function updateItem(idx: number, field: keyof QuoteItem, value: number | string) {
    const next = [...items];
    (next[idx] as any)[field] = value;
    if (field === "quantity" || field === "unitPrice") {
      next[idx].total = next[idx].quantity * next[idx].unitPrice;
    }
    setItems(next);
  }

  const subtotal = items.reduce((s, item) => s + (item.total || 0), 0);
  const gstAmount = subtotal * (gstPercent / 100);
  const grandTotal = subtotal + gstAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!vendorId) {
      setError("This RFQ has no assigned vendor. Cannot submit quotation.");
      return;
    }
    for (const it of items) {
      if (it.unitPrice <= 0) {
        setError(`Unit price for "${it.itemName}" must be greater than 0`);
        return;
      }
      if (it.quantity < 1) {
        setError(`Quantity for "${it.itemName}" must be at least 1`);
        return;
      }
    }
    if (gstPercent < 0 || gstPercent > 100) {
      setError("GST must be between 0 and 100");
      return;
    }
    if (deliveryDays < 1 || deliveryDays > 365) {
      setError("Delivery days must be 1–365");
      return;
    }
    if (!paymentTerms.trim() || paymentTerms.length > 200) {
      setError("Payment terms are required (1–200 chars)");
      return;
    }
    if (notes.length > 1000) {
      setError("Notes too long (max 1000 chars)");
      return;
    }
    if (subtotal <= 0) {
      setError("Quotation subtotal must be greater than 0");
      return;
    }

    setLoading(true);
    const res = await submitQuotation(
      rfqId,
      vendorId,
      { gstPercent, deliveryDays, paymentTerms: paymentTerms.trim(), notes: notes.trim() },
      items
    );
    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.push(`/rfqs/${rfqId}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/rfqs/${rfqId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Submit Quotation
        </h1>
      </div>

      {!rfq && (
        <Button onClick={loadRfq} variant="outline">
          Load RFQ Details
        </Button>
      )}

      {rfq && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">RFQ Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm font-medium">{rfq.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{rfq.description || "No description"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-heading text-lg font-medium">Your Quotation</h2>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <Label className="text-xs">Item</Label>
                      <Input value={item.itemName} readOnly />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" value={item.quantity} readOnly />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Unit Price (₹) *</Label>
                      <Input
                        type="number"
                        min={0.01}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Total</Label>
                      <Input value={item.total} readOnly />
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst">GST %</Label>
                  <Input
                    id="gst"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={gstPercent}
                    onChange={(e) => setGstPercent(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery">Delivery (days)</Label>
                  <Input
                    id="delivery"
                    type="number"
                    min={1}
                    max={365}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms">Payment Terms *</Label>
                  <Input
                    id="terms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Terms</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={1000}
                  placeholder="Payment terms: 20 days net..."
                />
              </div>

              <div className="flex justify-end">
                <Card className="w-full max-w-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST ({gstPercent}%)</span>
                      <span>₹{gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between font-medium">
                      <span>Grand Total</span>
                      <span>₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push(`/rfqs/${rfqId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Quotation"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
