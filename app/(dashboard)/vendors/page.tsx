import Link from "next/link";
import { getVendors, getVendorCounts } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Search, Plus, Eye } from "lucide-react";
import { VendorRatingCell } from "@/components/vendors/vendor-rating-cell";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const search = typeof sp?.search === "string" ? sp.search : undefined;
  const status = typeof sp?.status === "string" ? sp.status : undefined;
  const vendorsList = await getVendors(search, status);
  const counts = await getVendorCounts();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Vendors
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage supplier profiles and registrations.
          </p>
        </div>
        <Link href="/vendors/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Vendor
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Link href="/vendors" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            All ({counts.all})
          </Link>
          <Link href="/vendors?status=active" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            Active ({counts.active})
          </Link>
          <Link href="/vendors?status=pending" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${status === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            Pending ({counts.pending})
          </Link>
          <Link href="/vendors?status=blocked" className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${status === 'blocked' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            Blocked ({counts.blocked})
          </Link>
        </div>

        <form className="relative w-full sm:w-72" action="/vendors" method="GET">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Search by name, GST, category..."
            className="pl-9"
            defaultValue={search || ""}
          />
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Vendor Name</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">GST No.</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Rating</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorsList.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-sm font-medium">{v.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono text-xs">
                    {v.gstNumber}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.contactNumber}</TableCell>
                  <TableCell>
                    <VendorRatingCell vendorId={v.id} rating={v.rating ?? 0} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        v.status === "active"
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : v.status === "pending"
                          ? "border-amber-200 text-amber-700 bg-amber-50"
                          : "border-red-200 text-red-700 bg-red-50"
                      }`}
                    >
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/vendors/${v.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {vendorsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    No vendors found.
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
