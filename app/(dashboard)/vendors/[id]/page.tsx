import { notFound } from "next/navigation";
import Link from "next/link";
import { getVendorById, getVendorStats } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Hash, TrendingUp, ShoppingCart, FileText } from "lucide-react";
import { VendorRatingEditor } from "@/components/vendors/vendor-rating-editor";
import { format } from "date-fns";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getVendorById(Number(id));
  if (!vendor) return notFound();
  const stats = await getVendorStats(Number(id));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/vendors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                  {vendor.name}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">{vendor.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={
                      vendor.status === "active"
                        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                        : vendor.status === "pending"
                        ? "border-amber-200 text-amber-700 bg-amber-50"
                        : "border-red-200 text-red-700 bg-red-50"
                    }
                  >
                    {vendor.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Onboarded {format(new Date(vendor.createdAt), "dd MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vendor.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${vendor.email}`} className="text-foreground hover:underline truncate">
                  {vendor.email}
                </a>
              </div>
            )}
            {vendor.contactNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{vendor.contactNumber}</span>
              </div>
            )}
            {vendor.address && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{vendor.address}</span>
              </div>
            )}
            {vendor.gstNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs">{vendor.gstNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Vendor Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <VendorRatingEditor vendorId={vendor.id} rating={vendor.rating ?? 0} />
            <p className="text-xs text-muted-foreground mt-3">
              Click a star to rate this vendor. Rating is visible to procurement team when comparing quotations.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Spent</p>
                <p className="font-heading text-2xl font-semibold">
                  ₹{stats.totalSpent.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Purchase Orders</p>
                <p className="font-heading text-2xl font-semibold">{stats.purchaseOrderCount}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Quotations</p>
                <p className="font-heading text-2xl font-semibold">{stats.quotationCount}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">RFQs Assigned</p>
                <p className="font-heading text-2xl font-semibold">{stats.rfqCount}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
