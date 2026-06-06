"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVendor } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PHONE_REGEX = /^[+\-\s\d()]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validate(form: HTMLFormElement): string | null {
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const category = String(fd.get("category") || "").trim();
    const gst = String(fd.get("gstNumber") || "").trim();
    const phone = String(fd.get("contactNumber") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const address = String(fd.get("address") || "").trim();
    if (name.length < 2 || name.length > 200) return "Vendor name must be 2–200 characters";
    if (category.length < 1 || category.length > 100) return "Category is required (1–100 chars)";
    if (gst && !GST_REGEX.test(gst)) return "Invalid GSTIN (e.g. 22AAAAA0000A1Z5)";
    if (phone && !PHONE_REGEX.test(phone)) return "Invalid phone number";
    if (email && !EMAIL_REGEX.test(email)) return "Invalid email";
    if (address.length > 500) return "Address too long (max 500 chars)";
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const v = validate(e.currentTarget);
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("status", status);
    const res = await createVendor(formData);
    setLoading(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    router.push("/vendors");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground mb-6">
        Add Vendor
      </h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={2}
                  maxLength={200}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  name="category"
                  required
                  maxLength={100}
                  onBlur={() => setTouched((t) => ({ ...t, category: true }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  name="gstNumber"
                  maxLength={15}
                  placeholder="22AAAAA0000A1Z5"
                  onBlur={(e) => {
                    const v = e.target.value.trim().toUpperCase();
                    e.target.value = v;
                    setTouched((t) => ({ ...t, gstNumber: true }));
                  }}
                />
                {touched.gstNumber && (document?.getElementById("gstNumber") as HTMLInputElement)?.value && !GST_REGEX.test((document?.getElementById("gstNumber") as HTMLInputElement)?.value || "") && (
                  <p className="text-xs text-red-600">Invalid GSTIN format</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  maxLength={20}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v || "active")}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" maxLength={500} />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/vendors")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save Vendor"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
