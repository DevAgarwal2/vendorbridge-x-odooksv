import { db } from "@/lib/db";
import { rfqs, quotations, purchaseOrders, invoices, vendors, activityLogs } from "@/lib/db/schema";
import { sql, eq, gte, lte, count, sum, and, desc } from "drizzle-orm";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardStats(): Promise<any> {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const activeRfqs = await db
    .select({ count: count() })
    .from(rfqs)
    .where(eq(rfqs.status, "sent"));

  const pendingApprovals = await db
    .select({ count: count() })
    .from(quotations)
    .where(eq(quotations.status, "submitted"));

  const poTotal = await db
    .select({ total: sum(purchaseOrders.grandTotal) })
    .from(purchaseOrders)
    .where(
      and(
        gte(purchaseOrders.createdAt, thisMonthStart),
        lte(purchaseOrders.createdAt, thisMonthEnd)
      )
    );

  const overdueInvoices = await db
    .select({ count: count() })
    .from(invoices)
    .where(and(eq(invoices.status, "pending_payment"), lte(invoices.dueDate, now)));

  return {
    activeRfqs: activeRfqs[0]?.count ?? 0,
    pendingApprovals: pendingApprovals[0]?.count ?? 0,
    poTotal: poTotal[0]?.total ? Number(poTotal[0].total) : 0,
    overdueInvoices: overdueInvoices[0]?.count ?? 0,
  };
}

export async function getRecentPurchaseOrders(limit = 5): Promise<any[]> {
  return db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      status: purchaseOrders.status,
      grandTotal: purchaseOrders.grandTotal,
      createdAt: purchaseOrders.createdAt,
      vendorName: vendors.name,
    })
    .from(purchaseOrders)
    .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
    .orderBy(sql`${purchaseOrders.createdAt} desc`)
    .limit(limit) as any[];
}

export async function getSpendingTrends(months = 6): Promise<any[]> {
  const result = [] as { month: string; amount: number }[];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(monthStart);
    const label = monthStart.toLocaleString("en-IN", { month: "short", year: "2-digit" });

    const row = await db
      .select({ total: sum(purchaseOrders.grandTotal) })
      .from(purchaseOrders)
      .where(
        and(
          gte(purchaseOrders.createdAt, monthStart),
          lte(purchaseOrders.createdAt, monthEnd)
        )
      );

    result.push({ month: label, amount: row[0]?.total ? Number(row[0].total) : 0 });
  }

  return result;
}

export async function getFullReportData() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // Core stats
  const thisMonthSpend = await db
    .select({ total: sum(purchaseOrders.grandTotal) })
    .from(purchaseOrders)
    .where(
      and(
        gte(purchaseOrders.createdAt, thisMonthStart),
        lte(purchaseOrders.createdAt, thisMonthEnd)
      )
    );
  const lastMonthSpend = await db
    .select({ total: sum(purchaseOrders.grandTotal) })
    .from(purchaseOrders)
    .where(
      and(
        gte(purchaseOrders.createdAt, lastMonthStart),
        lte(purchaseOrders.createdAt, lastMonthEnd)
      )
    );
  const allTimeSpend = await db
    .select({ total: sum(purchaseOrders.grandTotal) })
    .from(purchaseOrders);

  const activeVendors = await db
    .select({ count: count() })
    .from(vendors)
    .where(eq(vendors.status, "active"));
  const totalVendors = await db.select({ count: count() }).from(vendors);

  const totalPos = await db.select({ count: count() }).from(purchaseOrders);
  const paidPos = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.status, "paid"));
  const pendingPos = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.status, "pending_payment"));

  const overdueInvoices = await db
    .select({ count: count() })
    .from(invoices)
    .where(and(eq(invoices.status, "pending_payment"), lte(invoices.dueDate, now)));
  const totalInvoices = await db.select({ count: count() }).from(invoices);
  const paidInvoices = await db
    .select({ count: count() })
    .from(invoices)
    .where(eq(invoices.status, "paid"));
  const invoiceValue = await db
    .select({ total: sum(invoices.grandTotal) })
    .from(invoices)
    .where(eq(invoices.status, "pending_payment"));

  const totalRfqs = await db.select({ count: count() }).from(rfqs);
  const sentRfqs = await db
    .select({ count: count() })
    .from(rfqs)
    .where(eq(rfqs.status, "sent"));
  const closedRfqs = await db
    .select({ count: count() })
    .from(rfqs)
    .where(eq(rfqs.status, "closed"));

  const totalQuotations = await db.select({ count: count() }).from(quotations);
  const pendingQuotations = await db
    .select({ count: count() })
    .from(quotations)
    .where(eq(quotations.status, "submitted"));

  // 6-month spending trend
  const months = [] as { month: string; amount: number; poCount: number }[];
  for (let i = 5; i >= 0; i--) {
    const ms = startOfMonth(subMonths(now, i));
    const me = endOfMonth(ms);
    const row = await db
      .select({ total: sum(purchaseOrders.grandTotal) })
      .from(purchaseOrders)
      .where(and(gte(purchaseOrders.createdAt, ms), lte(purchaseOrders.createdAt, me)));
    const cnt = await db
      .select({ count: count() })
      .from(purchaseOrders)
      .where(and(gte(purchaseOrders.createdAt, ms), lte(purchaseOrders.createdAt, me)));
    months.push({
      month: ms.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
      amount: row[0]?.total ? Number(row[0].total) : 0,
      poCount: cnt[0]?.count ?? 0,
    });
  }

  // Top vendors by spend
  const topVendors = await db
    .select({
      vendorId: purchaseOrders.vendorId,
      vendorName: vendors.name,
      totalSpend: sum(purchaseOrders.grandTotal),
      poCount: count(purchaseOrders.id),
    })
    .from(purchaseOrders)
    .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
    .groupBy(purchaseOrders.vendorId, vendors.name)
    .orderBy(desc(sum(purchaseOrders.grandTotal)))
    .limit(10) as any[];

  // PO status breakdown
  const poStatusBreakdown = await db
    .select({
      status: purchaseOrders.status,
      count: count(),
    })
    .from(purchaseOrders)
    .groupBy(purchaseOrders.status) as any[];

  // Recent activity (last 20)
  const recentActivity = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(20) as any[];

  return {
    period: {
      from: thisMonthStart,
      to: thisMonthEnd,
      generatedAt: now,
    },
    spending: {
      thisMonth: thisMonthSpend[0]?.total ? Number(thisMonthSpend[0].total) : 0,
      lastMonth: lastMonthSpend[0]?.total ? Number(lastMonthSpend[0].total) : 0,
      allTime: allTimeSpend[0]?.total ? Number(allTimeSpend[0].total) : 0,
    },
    vendors: {
      active: activeVendors[0]?.count ?? 0,
      total: totalVendors[0]?.count ?? 0,
    },
    purchaseOrders: {
      total: totalPos[0]?.count ?? 0,
      paid: paidPos[0]?.count ?? 0,
      pending: pendingPos[0]?.count ?? 0,
      fulfillmentRate:
        (totalPos[0]?.count ?? 0) > 0
          ? Math.round(((paidPos[0]?.count ?? 0) / (totalPos[0]?.count ?? 0)) * 100)
          : 0,
    },
    invoices: {
      total: totalInvoices[0]?.count ?? 0,
      paid: paidInvoices[0]?.count ?? 0,
      overdue: overdueInvoices[0]?.count ?? 0,
      pendingValue: invoiceValue[0]?.total ? Number(invoiceValue[0].total) : 0,
      paymentRate:
        (totalInvoices[0]?.count ?? 0) > 0
          ? Math.round(((paidInvoices[0]?.count ?? 0) / (totalInvoices[0]?.count ?? 0)) * 100)
          : 0,
    },
    rfqs: {
      total: totalRfqs[0]?.count ?? 0,
      sent: sentRfqs[0]?.count ?? 0,
      closed: closedRfqs[0]?.count ?? 0,
    },
    quotations: {
      total: totalQuotations[0]?.count ?? 0,
      pending: pendingQuotations[0]?.count ?? 0,
    },
    months,
    topVendors: topVendors.map((v: any) => ({
      name: v.vendorName || "—",
      totalSpend: v.totalSpend ? Number(v.totalSpend) : 0,
      poCount: v.poCount ?? 0,
    })),
    poStatusBreakdown: poStatusBreakdown.map((p: any) => ({
      status: p.status,
      count: p.count,
    })),
    recentActivity: recentActivity.map((a: any) => ({
      type: a.type,
      title: a.title,
      description: a.description,
      createdAt: a.createdAt,
    })),
  };
}


