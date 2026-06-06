"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRfq, getVendors } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Truck, Paperclip, Upload, FileText, FileSpreadsheet, FileType, Image as ImageIcon } from "lucide-react";

type Item = { itemName: string; quantity: number; unit: string };

export default function NewRfqPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<Item[]>([{ itemName: "", quantity: 1, unit: "NOS" }]);
  const [vendorIds, setVendorIds] = useState<number[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function fileIcon(mime: string) {
    if (mime.startsWith("image/")) return ImageIcon;
    if (mime.includes("sheet") || mime.includes("excel")) return FileSpreadsheet;
    if (mime.includes("pdf") || mime.includes("word") || mime.includes("text")) return FileText;
    return FileType;
  }

  function formatBytes(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  async function loadVendors() {
    const vs = await getVendors();
    setVendors(vs);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();
    const category = String(fd.get("category") || "").trim();
    const deadline = String(fd.get("deadline") || "").trim();
    const description = String(fd.get("description") || "").trim();

    if (title.length < 3 || title.length > 200) {
      setError("Title must be 3–200 characters");
      return;
    }
    if (category.length < 1 || category.length > 100) {
      setError("Category is required (1–100 chars)");
      return;
    }
    if (!deadline) {
      setError("Deadline is required");
      return;
    }
    const dl = new Date(deadline);
    if (isNaN(dl.getTime())) {
      setError("Invalid deadline");
      return;
    }
    if (dl.getTime() < Date.now() - 60_000) {
      setError("Deadline must be in the future");
      return;
    }
    if (description.length > 2000) {
      setError("Description too long (max 2000 chars)");
      return;
    }
    const validItems = items.filter((i) => i.itemName.trim());
    if (validItems.length === 0) {
      setError("Add at least one line item");
      return;
    }
    for (const it of validItems) {
      if (it.itemName.length > 200) {
        setError("Item name too long");
        return;
      }
      if (!Number.isInteger(it.quantity) || it.quantity < 1) {
        setError("Quantity must be a positive integer");
        return;
      }
      if (it.unit.length > 30) {
        setError("Unit name too long");
        return;
      }
    }
    if (vendorIds.length === 0) {
      setError("Assign at least one vendor");
      return;
    }

    setLoading(true);
    for (const f of files) {
      fd.append("attachments", f);
    }
    const res = await createRfq(fd, validItems, vendorIds);
    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.push(`/rfqs/${res.data?.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground mb-6">
        Create RFQ
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">RFQ Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Office Furniture Procurement Q2"
                  required
                  minLength={3}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g. Furniture"
                  required
                  maxLength={100}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the procurement requirements..."
                maxLength={2000}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-medium">Line Items *</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems([...items, { itemName: "", quantity: 1, unit: "NOS" }])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <Label className="text-xs">Item Name *</Label>
                    <Input
                      value={item.itemName}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx].itemName = e.target.value;
                        setItems(next);
                      }}
                      maxLength={200}
                      placeholder="e.g. Ergonomic Chair"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Qty *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx].quantity = Number(e.target.value);
                        setItems(next);
                      }}
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Unit *</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx].unit = e.target.value;
                        setItems(next);
                      }}
                      maxLength={30}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      disabled={items.length === 1}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-medium">Assign Vendors *</h2>
              <Button type="button" variant="outline" size="sm" onClick={loadVendors}>
                <Truck className="h-3.5 w-3.5 mr-1" />
                Load Vendors
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {vendors.map((v) => (
                <Badge
                  key={v.id}
                  variant={vendorIds.includes(v.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setVendorIds(
                      vendorIds.includes(v.id)
                        ? vendorIds.filter((id) => id !== v.id)
                        : [...vendorIds, v.id]
                    );
                  }}
                >
                  {v.name}
                </Badge>
              ))}
            </div>
            {vendors.length === 0 && (
              <p className="text-sm text-muted-foreground">Click Load Vendors to see available vendors.</p>
            )}
            {vendorIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{vendorIds.length} vendor(s) selected</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                Attachments
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </h2>
              {files.length > 0 && (
                <span className="text-xs text-muted-foreground">{files.length} file(s)</span>
              )}
            </div>
            <div className="rounded-md border-2 border-dashed border-border bg-muted/30 px-4 py-4 text-center">
              <input
                id="attachments"
                name="attachments"
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files).filter((f) => f.size <= 10 * 1024 * 1024);
                    setFiles((prev) => [...prev, ...newFiles]);
                  }
                }}
              />
              <label htmlFor="attachments" className="cursor-pointer inline-flex flex-col items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">PDF, images, docs (max 10MB each)</p>
                </div>
              </label>
            </div>
            {files.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {files.map((f, idx) => {
                  const Icon = fileIcon(f.type);
                  return (
                    <div key={idx} className="flex items-center gap-2.5 rounded-md border border-border bg-card p-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={f.name}>{f.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(idx)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/rfqs")}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save as Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
