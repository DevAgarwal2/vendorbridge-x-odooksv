import { getFullReportData } from "../lib/queries";
import { generateReportPDF } from "../lib/pdf";
import * as fs from "fs";

async function main() {
  console.log("=== Reports PDF Test ===\n");

  console.log("Step 1: Fetching report data from DB...");
  const data = await getFullReportData();
  console.log("  ✓ Period:", data.period.from.toISOString().slice(0, 10), "→", data.period.to.toISOString().slice(0, 10));
  console.log("  ✓ Spend this month:", data.spending.thisMonth);
  console.log("  ✓ Spend last month:", data.spending.lastMonth);
  console.log("  ✓ All-time spend:", data.spending.allTime);
  console.log("  ✓ Active vendors:", data.vendors.active, "/", data.vendors.total);
  console.log("  ✓ POs:", data.purchaseOrders);
  console.log("  ✓ Invoices:", data.invoices);
  console.log("  ✓ RFQs:", data.rfqs);
  console.log("  ✓ Quotations:", data.quotations);
  console.log("  ✓ Months:", data.months.length, "buckets");
  console.log("  ✓ Top vendors:", data.topVendors.length);
  console.log("  ✓ PO status breakdown:", data.poStatusBreakdown.length, "states");
  console.log("  ✓ Recent activity:", data.recentActivity.length, "events");

  console.log("\nStep 2: Generating PDF...");
  const doc = generateReportPDF(data);
  console.log("  ✓ Pages:", doc.getNumberOfPages());

  const pdfBytes = doc.output("arraybuffer");
  const pdfBuffer = Buffer.from(pdfBytes);
  const filename = "/tmp/test-report.pdf";
  fs.writeFileSync(filename, pdfBuffer);
  const stats = fs.statSync(filename);
  console.log("  ✓ Saved:", filename, `(${stats.size} bytes)`);

  console.log("\nStep 3: Verifying PDF magic header...");
  const header = pdfBuffer.slice(0, 8).toString("latin1");
  console.log("  Header:", header);
  if (header.startsWith("%PDF-")) {
    console.log("  ✓ Valid PDF magic header");
  } else {
    console.log("  ✗ INVALID PDF header");
    process.exit(1);
  }

  console.log("\nStep 4: Verifying PDF content...");
  const content = pdfBuffer.toString("latin1");
  const checks = [
    { name: "Cover page (Procurement Analytics Report)", test: content.includes("Procurement") && content.includes("Analytics Report") },
    { name: "VendorBridge branding", test: content.includes("VendorBridge") },
    { name: "Executive Summary", test: content.includes("Executive Summary") },
    { name: "Spending Trends", test: content.includes("Spending Trends") },
    { name: "Top Vendors", test: content.includes("Top Vendors") },
    { name: "Status Breakdown", test: content.includes("Status Breakdown") },
    { name: "Recent Activity", test: content.includes("Recent Activity") },
    { name: "Page footers", test: content.includes("Page") },
  ];
  for (const c of checks) {
    console.log(`  ${c.test ? "✓" : "✗"} ${c.name}`);
    if (!c.test) process.exit(1);
  }

  console.log("\n=== All checks passed ===");
  console.log(`Open ${filename} to inspect the report (${(stats.size / 1024).toFixed(1)} KB, ${doc.getNumberOfPages()} pages).`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
