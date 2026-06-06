// Idempotent demo seeder. Safe to run multiple times — checks for existing
// rows before inserting and only creates what's missing.

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../lib/db/schema";

const client = new Database("./sqlite.db");
client.exec("PRAGMA foreign_keys = ON;");
const db = drizzle(client, { schema });

function vendorExists(name: string, category: string) {
  return client
    .query("SELECT id FROM vendors WHERE name = ? AND category = ? LIMIT 1")
    .get(name, category) as { id: number } | undefined;
}
function rfqExists(title: string) {
  return client
    .query("SELECT id FROM rfqs WHERE title = ? LIMIT 1")
    .get(title) as { id: number } | undefined;
}

async function seed() {
  console.log("Seeding (idempotent)...\n");

  // --- Vendors ----------------------------------------------------------
  const vendorsData = [
    { name: "Infra Supplies Pvt Ltd", category: "Construction", gstNumber: "27AABCS1429B1Z0", contactNumber: "+91-9876543210", email: "contact@infrasupplies.com", address: "456, Industrial Estate, Surat", status: "active" as const, rating: 4.5 },
    { name: "Tech Core LTD",          category: "IT",            gstNumber: "27AABCS1429B2Z0", contactNumber: "+91-9123456789", email: "sales@techcore.com",       address: "789, Tech Park, Bangalore",  status: "active" as const, rating: 3.8 },
    { name: "FastLog Transport",      category: "Logistics",     gstNumber: "27AABCS1429B3Z0", contactNumber: "+91-9988776655", email: "ops@fastlog.in",           address: "12, Transport Nagar, Delhi", status: "blocked" as const, rating: 3.2 },
    { name: "OfficeNeed Co",          category: "Furniture",     gstNumber: "27AABCS1429B4Z0", contactNumber: "+91-9876512345", email: "hello@officeneed.com",     address: "101, Business Hub, Mumbai",  status: "active" as const, rating: 4.2 },
    { name: "AcerPro Hardware",       category: "IT",            gstNumber: "27AABCA1234A1Z5", contactNumber: "+91-9876500001", email: "sales@acerpro.in",         address: "Mumbai",                     status: "active" as const, rating: 4.6 },
    { name: "BlueChip Devices",       category: "IT",            gstNumber: "27AAACB2345B1Z6", contactNumber: "+91-9876500002", email: "hello@bluechip.in",        address: "Bangalore",                  status: "active" as const, rating: 4.1 },
    { name: "CompuMart Direct",       category: "IT",            gstNumber: "27AABCD3456C1Z7", contactNumber: "+91-9876500003", email: "biz@compumart.in",         address: "Pune",                       status: "active" as const, rating: 3.5 },
  ];

  for (const v of vendorsData) {
    if (vendorExists(v.name, v.category)) continue;
    db.insert(schema.vendors).values(v).run();
    console.log(`  + vendor: ${v.name}`);
  }

  const v = (name: string) => {
    const row = client.query("SELECT id FROM vendors WHERE name = ? LIMIT 1").get(name) as { id: number } | undefined;
    if (!row) throw new Error(`vendor not found: ${name}`);
    return row.id;
  };

  // --- Main RFQ with 3 quotations (demo comparison) ---------------------
  const demoTitle = "Demo: Office Furniture Q2";
  let demoRfqId: number;
  const existingDemo = rfqExists(demoTitle);
  if (existingDemo) {
    demoRfqId = existingDemo.id;
    console.log(`  = demo RFQ exists (id ${demoRfqId})`);
  } else {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    db.insert(schema.rfqs).values({
      title: demoTitle,
      category: "Furniture",
      description: "Ergonomic chairs and standing desks for the 3rd floor (demo comparison data — 3 vendor bids).",
      deadline,
      status: "sent",
      createdById: "demo-user",
    }).run();
    demoRfqId = Number(
      (client.query("SELECT last_insert_rowid() AS id").get() as { id: number }).id
    );
    console.log(`  + demo RFQ: id ${demoRfqId}`);

    for (const item of [
      { itemName: "Ergonomic Chair", quantity: 25, unit: "NOS" },
      { itemName: "Standing Desk",   quantity: 10, unit: "NOS" },
    ]) {
      db.insert(schema.rfqLineItems).values({ rfqId: demoRfqId, ...item }).run();
    }

    for (const vendorId of [v("Infra Supplies Pvt Ltd"), v("Tech Core LTD"), v("OfficeNeed Co")]) {
      db.insert(schema.rfqVendors).values({ rfqId: demoRfqId, vendorId }).run();
    }
  }

  // Quotations for the demo RFQ (idempotent: check existing by rfq+vendor)
  const demoQuotations = [
    { vendor: "Infra Supplies Pvt Ltd", subtotal: 185000, gstPercent: 18, gstAmount: 33300,  grandTotal: 218300, deliveryDays: 10, notes: "Standard warranty included",         paymentTerms: "30 days" },
    { vendor: "Tech Core LTD",          subtotal: 214800, gstPercent: 18, gstAmount: 38664,  grandTotal: 253464, deliveryDays: 7,  notes: "Express delivery available",        paymentTerms: "15 days" },
    { vendor: "OfficeNeed Co",          subtotal: 200010, gstPercent: 18, gstAmount: 36001.8,grandTotal: 236011.8,deliveryDays: 14, notes: "Installation included",             paymentTerms: "30 days" },
  ];
  for (const q of demoQuotations) {
    const existing = client
      .query("SELECT id FROM quotations WHERE rfq_id = ? AND vendor_id = ? LIMIT 1")
      .get(demoRfqId, v(q.vendor)) as { id: number } | undefined;
    if (existing) continue;
    db.insert(schema.quotations).values({
      rfqId: demoRfqId,
      vendorId: v(q.vendor),
      subtotal: q.subtotal,
      gstPercent: q.gstPercent,
      gstAmount: q.gstAmount,
      grandTotal: q.grandTotal,
      deliveryDays: q.deliveryDays,
      notes: q.notes,
      paymentTerms: q.paymentTerms,
      status: "submitted",
      submittedById: "demo-user",
    }).run();
    const qId = Number(
      (client.query("SELECT last_insert_rowid() AS id").get() as { id: number }).id
    );
    for (const li of [
      { itemName: "Ergonomic Chair", quantity: 25, unitPrice: Math.round(q.subtotal * 25 / 35), total: Math.round(q.subtotal * 25 / 35) * 25 },
      { itemName: "Standing Desk",   quantity: 10, unitPrice: Math.round(q.subtotal * 10 / 35), total: Math.round(q.subtotal * 10 / 35) * 10 },
    ]) {
      db.insert(schema.quotationLineItems).values({ quotationId: qId, ...li }).run();
    }
    console.log(`  + demo quotation: ${q.vendor}`);
  }

  // --- Other RFQs (lightweight) ----------------------------------------
  const otherRfqs = [
    { title: "IT Infrastructure Upgrade",  category: "IT",          status: "draft" as const,  deadlineDays: 45 },
    { title: "Construction Materials Q3", category: "Construction",status: "closed" as const, deadlineDays: 22 },
  ];
  for (const r of otherRfqs) {
    if (rfqExists(r.title)) continue;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + r.deadlineDays);
    db.insert(schema.rfqs).values({
      title: r.title,
      category: r.category,
      description: "Sample data — expand as you go.",
      deadline,
      status: r.status,
      createdById: "demo-user",
    }).run();
    console.log(`  + RFQ: ${r.title}`);
  }

  // --- Activity log ----------------------------------------------------
  const logExists = client.query("SELECT id FROM activity_logs LIMIT 1").get();
  if (!logExists) {
    const logs = [
      { type: "rfq"       as const, title: "RFQ published",      description: `${demoTitle} sent to 3 vendors` },
      { type: "quotation" as const, title: "Quotations received",description: "3 vendor bids on " + demoTitle },
      { type: "vendor"    as const, title: "Vendor added",       description: "AcerPro Hardware registered" },
      { type: "invoice"   as const, title: "Invoice generated",  description: "INV-2025-0101 generated for PO-2025-0068" },
      { type: "approval"  as const, title: "Approval pending",   description: "PO-2025-0068 awaiting L2 approval" },
    ];
    for (const l of logs) db.insert(schema.activityLogs).values(l).run();
    console.log(`  + ${logs.length} activity logs`);
  }

  // --- Summary ---------------------------------------------------------
  const counts = {
    vendors:    (client.query("SELECT COUNT(*) AS c FROM vendors").get()        as { c: number }).c,
    rfqs:       (client.query("SELECT COUNT(*) AS c FROM rfqs").get()           as { c: number }).c,
    quotations: (client.query("SELECT COUNT(*) AS c FROM quotations").get()     as { c: number }).c,
    lineItems:  (client.query("SELECT COUNT(*) AS c FROM rfq_line_items").get()as { c: number }).c,
    logs:       (client.query("SELECT COUNT(*) AS c FROM activity_logs").get()  as { c: number }).c,
  };
  console.log("\nDB now contains:", counts);
  console.log(`\nDemo comparison RFQ: /quotations/compare?rfqId=${demoRfqId}`);
  console.log("Seed complete.");
  client.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
