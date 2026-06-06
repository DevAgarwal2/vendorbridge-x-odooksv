import { getDashboardStats, getRecentPurchaseOrders, getSpendingTrends } from "@/lib/queries";
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
import { SpendingBarChart } from "@/components/charts/spending-bar-chart";
import {
  FileText,
  Clock,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Plus,
  Truck,
  Receipt,
} from "lucide-react";
import Link from "next/link";

function formatCurrency(val: number) {
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentPOs = await getRecentPurchaseOrders();
  const trends = await getSpendingTrends();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Here&apos;s your procurement overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/rfqs/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New RFQ
            </Button>
          </Link>
          <Link href="/vendors/new">
            <Button variant="outline" size="sm">
              <Truck className="h-4 w-4 mr-1.5" />
              Add Vendor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Active RFQs
                </p>
                <p className="font-heading text-2xl font-semibold">{stats.activeRfqs}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pending Approvals
                </p>
                <p className="font-heading text-2xl font-semibold">{stats.pendingApprovals}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  POs This Month
                </p>
                <p className="font-heading text-2xl font-semibold">
                  {formatCurrency(stats.poTotal)}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Overdue Invoices
                </p>
                <p className="font-heading text-2xl font-semibold">{stats.overdueInvoices}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500/10 text-red-600">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Recent POs */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="font-heading text-lg">Spending Trends</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent>
            <SpendingBarChart data={trends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="font-heading text-lg">Recent Purchase Orders</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">PO#</TableHead>
                  <TableHead className="text-xs">Vendor</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPOs.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="text-sm font-medium">{po.poNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {po.vendorName || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      {po.grandTotal ? formatCurrency(po.grandTotal) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {po.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentPOs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                      No purchase orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
