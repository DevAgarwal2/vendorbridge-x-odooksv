import { db } from "../lib/db";
import { vendors, rfqs, rfqLineItems, rfqVendors, quotations, quotationLineItems, purchaseOrders, poItems, invoices, activityLogs } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function testWorkflow() {
  console.log("=== Testing full procurement workflow ===\n");

  // 1. Create a vendor
  console.log("1. Create vendor");
  const [v] = await db.insert(vendors).values({
    name: "Workflow Test Vendor",
    category: "IT",
    status: "active",
  }).returning();
  console.log("   Created vendor:", v.id);

  // 2. Create RFQ
  console.log("2. Create RFQ");
  const [r] = await db.insert(rfqs).values({
    title: "Workflow Test RFQ",
    category: "IT",
    description: "Test workflow",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: "sent",
    createdById: "test",
  }).returning();
  console.log("   Created RFQ:", r.id);

  // 3. Add line items
  console.log("3. Add RFQ line items");
  await db.insert(rfqLineItems).values({ rfqId: r.id, itemName: "Laptop", quantity: 5, unit: "NOS" });
  await db.insert(rfqLineItems).values({ rfqId: r.id, itemName: "Monitor", quantity: 5, unit: "NOS" });
  console.log("   Added 2 line items");

  // 4. Assign vendor
  console.log("4. Assign vendor to RFQ");
  await db.insert(rfqVendors).values({ rfqId: r.id, vendorId: v.id });
  console.log("   Vendor assigned");

  // 5. Submit quotation
  console.log("5. Submit quotation");
  const [q] = await db.insert(quotations).values({
    rfqId: r.id,
    vendorId: v.id,
    subtotal: 500000,
    gstPercent: 18,
    gstAmount: 90000,
    grandTotal: 590000,
    deliveryDays: 7,
    paymentTerms: "30 days",
    status: "submitted",
  }).returning();
  console.log("   Quotation submitted:", q.id);

  // 6. Add quotation line items
  console.log("6. Add quotation line items");
  await db.insert(quotationLineItems).values({ quotationId: q.id, itemName: "Laptop", quantity: 5, unitPrice: 60000, total: 300000 });
  await db.insert(quotationLineItems).values({ quotationId: q.id, itemName: "Monitor", quantity: 5, unitPrice: 40000, total: 200000 });
  console.log("   Added 2 line items");

  // 7. Approve quotation
  console.log("7. Approve quotation");
  await db.update(quotations).set({ status: "approved" }).where(eq(quotations.id, q.id));
  console.log("   Quotation approved");

  // 8. Create PO from quotation
  console.log("8. Create Purchase Order");
  const [po] = await db.insert(purchaseOrders).values({
    poNumber: `PO-TEST-${Date.now()}`,
    rfqId: r.id,
    vendorId: v.id,
    quotationId: q.id,
    status: "approved",
    subtotal: 500000,
    cgst: 45000,
    sgst: 45000,
    grandTotal: 590000,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }).returning();
  console.log("   PO created:", po.poNumber);

  // 9. Add PO items
  console.log("9. Add PO items");
  await db.insert(poItems).values({ poId: po.id, itemName: "Laptop", quantity: 5, unitPrice: 60000, total: 300000 });
  await db.insert(poItems).values({ poId: po.id, itemName: "Monitor", quantity: 5, unitPrice: 40000, total: 200000 });

  // 10. Generate invoice
  console.log("10. Generate invoice");
  const [inv] = await db.insert(invoices).values({
    invoiceNumber: `INV-TEST-${Date.now()}`,
    poId: po.id,
    vendorId: v.id,
    status: "pending_payment",
    subtotal: 500000,
    cgst: 45000,
    sgst: 45000,
    grandTotal: 590000,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }).returning();
  console.log("    Invoice created:", inv.invoiceNumber);

  // 11. Add activity log
  console.log("11. Add activity log");
  await db.insert(activityLogs).values({
    type: "po",
    title: "Test PO created",
    description: `PO ${po.poNumber} created via workflow test`,
  });
  console.log("    Activity log added");

  console.log("\n=== All workflow steps PASSED ===");
  process.exit(0);
}

testWorkflow().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
