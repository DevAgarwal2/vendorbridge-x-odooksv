import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendingBarChart } from "@/components/charts/spending-bar-chart";
import { ExportReportButton } from "@/components/reports/export-report-button";
import { TrendingUp, Users, CheckCircle, AlertTriangle, ShoppingCart, FileText, ClipboardList, BarChart3 } from "lucide-react";
import { getFullReportData } from "@/lib/queries";

function formatCurrency(val: number) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toLocaleString("en-IN")}`;
}

function formatINRFull(val: number) {
  return `₹${val.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default async function ReportsPage() {
  const data = await getFullReportData();

  const spendChange = data.spending.lastMonth > 0
    ? ((data.spending.thisMonth - data.spending.lastMonth) / data.spending.lastMonth) * 100
    : 0;
  const spendChangePositive = spendChange >= 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Analytics & Insights</span>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Procurement insights and trends • {data.period.from.toLocaleDateString("en-IN", { dateStyle: "medium" })} – {data.period.to.toLocaleDateString("en-IN", { dateStyle: "medium" })}
          </p>
        </div>
        <ExportReportButton data={data} />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Spend
                </p>
                <p className="font-heading text-2xl font-semibold">{formatCurrency(data.spending.thisMonth)}</p>
                <p className={`text-xs flex items-center gap-1 ${spendChangePositive ? "text-emerald-600" : "text-red-600"}`}>
                  <TrendingUp className={`h-3 w-3 ${!spendChangePositive && "rotate-180"}`} />
                  {spendChangePositive ? "+" : ""}{spendChange.toFixed(1)}% from last month
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
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Active Vendors
                </p>
                <p className="font-heading text-2xl font-semibold">{data.vendors.active}</p>
                <p className="text-xs text-muted-foreground">
                  {data.vendors.total} total registered
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  PO Fulfillment
                </p>
                <p className="font-heading text-2xl font-semibold">{data.purchaseOrders.fulfillmentRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {data.purchaseOrders.paid} of {data.purchaseOrders.total} paid
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-500/10 text-sky-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Overdue Invoices
                </p>
                <p className="font-heading text-2xl font-semibold">{data.invoices.overdue}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(data.invoices.pendingValue)} pending
                </p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${data.invoices.overdue > 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Purchase Orders</p>
                <p className="font-semibold text-lg">{data.purchaseOrders.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-muted-foreground">RFQs</p>
                <p className="font-semibold text-lg">{data.rfqs.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">Quotations</p>
                <p className="font-semibold text-lg">{data.quotations.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Invoices</p>
                <p className="font-semibold text-lg">{data.invoices.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-heading text-lg">Monthly Spend</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Procurement value over the last 6 months</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">6-month total</p>
            <p className="text-sm font-semibold">{formatINRFull(data.months.reduce((s, m) => s + m.amount, 0))}</p>
          </div>
        </CardHeader>
        <CardContent>
          <SpendingBarChart data={data.months} />
        </CardContent>
      </Card>
    </div>
  );
}
