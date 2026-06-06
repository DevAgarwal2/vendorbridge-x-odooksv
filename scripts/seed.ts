import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../lib/db/schema";

const client = new Database("./sqlite.db");
client.exec("PRAGMA foreign_keys = ON;");
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding...");

  const vendorsData = [
    { name: "Infra Supplies Pvt Ltd", category: "Construction", gstNumber: "27AABCS1429B1Z0", contactNumber: "+91-9876543210", email: "contact@infrasupplies.com", address: "456, Industrial Estate, Surat", status: "active" as const, rating: 4.5 },
    { name: "Tech Core LTD", category: "IT", gstNumber: "27AABCS1429B2Z0", contactNumber: "+91-9123456789", email: "sales@techcore.com", address: "789, Tech Park, Bangalore", status: "active" as const, rating: 3.8 },
    { name: "FastLog Transport", category: "Logistics", gstNumber: "27AABCS1429B3Z0", contactNumber: "+91-9988776655", email: "ops@fastlog.in", address: "12, Transport Nagar, Delhi", status: "blocked" as const, rating: 3.2 },
    { name: "OfficeNeed Co", category: "Furniture", gstNumber: "27AABCS1429B4Z0", contactNumber: "+91-9876512345", email: "hello@officeneed.com", address: "101, Business Hub, Mumbai", status: "active" as const, rating: 4.2 },
  ];

  for (const v of vendorsData) {
    db.insert(schema.vendors).values(v).run();
  }

  const rfqData = [
    { title: "Office Furniture Procurement Q2", category: "Furniture", description: "Ergonomic chairs and standing desks for 3rd floor", deadline: new Date("2025-06-15"), status: "sent" as const, createdById: "demo-user" },
    { title: "IT Infrastructure Upgrade", category: "IT", description: "Servers and networking equipment for data center", deadline: new Date("2025-07-01"), status: "draft" as const, createdById: "demo-user" },
    { title: "Construction Materials Q3", category: "Construction", description: "Cement, steel rods, and bricks for site A", deadline: new Date("2025-06-30"), status: "closed" as const, createdById: "demo-user" },
  ];

  for (const r of rfqData) {
    db.insert(schema.rfqs).values(r).run();
  }

  const rfqItems = [
    { rfqId: 1, itemName: "Ergonomic Chair", quantity: 25, unit: "NOS" },
    { rfqId: 1, itemName: "Standing Desk", quantity: 10, unit: "NOS" },
    { rfqId: 2, itemName: "Server Rack", quantity: 2, unit: "NOS" },
    { rfqId: 2, itemName: "Network Switch 48-port", quantity: 5, unit: "NOS" },
    { rfqId: 3, itemName: "Portland Cement", quantity: 500, unit: "Bags" },
  ];

  for (const item of rfqItems) {
    db.insert(schema.rfqLineItems).values(item).run();
  }

  const rfqVendors = [
    { rfqId: 1, vendorId: 1 },
    { rfqId: 1, vendorId: 2 },
    { rfqId: 1, vendorId: 4 },
    { rfqId: 2, vendorId: 2 },
    { rfqId: 2, vendorId: 3 },
  ];

  for (const rv of rfqVendors) {
    db.insert(schema.rfqVendors).values(rv).run();
  }

  const quotationsData = [
    { rfqId: 1, vendorId: 1, subtotal: 185000, gstPercent: 18, gstAmount: 33300, grandTotal: 218300, deliveryDays: 10, notes: "Standard warranty included", paymentTerms: "30 days", status: "submitted" as const },
    { rfqId: 1, vendorId: 2, subtotal: 214800, gstPercent: 18, gstAmount: 38664, grandTotal: 253464, deliveryDays: 7, notes: "Express delivery available", paymentTerms: "15 days", status: "submitted" as const },
    { rfqId: 1, vendorId: 4, subtotal: 200010, gstPercent: 18, gstAmount: 36001.8, grandTotal: 236011.8, deliveryDays: 14, notes: "Installation included", paymentTerms: "30 days", status: "submitted" as const },
  ];

  for (const q of quotationsData) {
    db.insert(schema.quotations).values(q).run();
  }

  const qItems = [
    { quotationId: 1, itemName: "Ergonomic Chair", quantity: 25, unitPrice: 3500, total: 87500 },
    { quotationId: 1, itemName: "Standing Desk", quantity: 10, unitPrice: 9750, total: 97500 },
    { quotationId: 2, itemName: "Ergonomic Chair", quantity: 25, unitPrice: 4200, total: 105000 },
    { quotationId: 2, itemName: "Standing Desk", quantity: 10, unitPrice: 10980, total: 109800 },
    { quotationId: 3, itemName: "Ergonomic Chair", quantity: 25, unitPrice: 3800, total: 95000 },
    { quotationId: 3, itemName: "Standing Desk", quantity: 10, unitPrice: 10501, total: 105010 },
  ];

  for (const qi of qItems) {
    db.insert(schema.quotationLineItems).values(qi).run();
  }

  const poData = [
    { poNumber: "PO-2025-0068", rfqId: 1, vendorId: 1, quotationId: 1, status: "pending_payment" as const, subtotal: 169500, cgst: 15255, sgst: 15255, grandTotal: 200010, dueDate: new Date("2025-06-21") },
    { poNumber: "PO-2025-0069", rfqId: 2, vendorId: 2, quotationId: 2, status: "approved" as const, subtotal: 140000, cgst: 12600, sgst: 12600, grandTotal: 165200, dueDate: new Date("2025-07-10") },
    { poNumber: "PO-2025-0070", rfqId: 3, vendorId: 1, quotationId: 3, status: "draft" as const, subtotal: 34900, cgst: 3141, sgst: 3141, grandTotal: 41182, dueDate: new Date("2025-07-05") },
  ];

  for (const po of poData) {
    db.insert(schema.purchaseOrders).values(po).run();
  }

  const poItems = [
    { poId: 1, itemName: "Ergonomic Chair", quantity: 25, unitPrice: 3500, total: 87500 },
    { poId: 1, itemName: "Standing Desk", quantity: 10, unitPrice: 8200, total: 82000 },
    { poId: 2, itemName: "Server Rack", quantity: 2, unitPrice: 45000, total: 90000 },
    { poId: 2, itemName: "Network Switch 48-port", quantity: 5, unitPrice: 10000, total: 50000 },
    { poId: 3, itemName: "Portland Cement", quantity: 500, unitPrice: 69.8, total: 34900 },
  ];

  for (const pi of poItems) {
    db.insert(schema.poItems).values(pi).run();
  }

  const invoiceData = [
    { invoiceNumber: "INV-2025-0101", poId: 1, vendorId: 1, status: "pending_payment" as const, subtotal: 169500, cgst: 15255, sgst: 15255, grandTotal: 200010, dueDate: new Date("2025-06-21") },
    { invoiceNumber: "INV-2025-0102", poId: 2, vendorId: 2, status: "paid" as const, subtotal: 140000, cgst: 12600, sgst: 12600, grandTotal: 165200, dueDate: new Date("2025-07-10") },
    { invoiceNumber: "INV-2025-0103", poId: 3, vendorId: 1, status: "draft" as const, subtotal: 34900, cgst: 3141, sgst: 3141, grandTotal: 41182, dueDate: new Date("2025-07-05") },
  ];

  for (const inv of invoiceData) {
    db.insert(schema.invoices).values(inv).run();
  }

  const logs = [
    { type: "quotation" as const, title: "Quotation selected", description: "Infra Supplies Pvt Ltd selected for Office Furniture Q2" },
    { type: "approval" as const, title: "Approval pending", description: "PO-2025-0068 awaiting L2 approval by Priya Shah" },
    { type: "rfq" as const, title: "RFQ published", description: "Office Furniture Q2 sent to 3 vendors" },
    { type: "vendor" as const, title: "Vendor added", description: "FastLog Transport registered and pending verification" },
    { type: "invoice" as const, title: "Invoice generated", description: "INV-2025-0101 generated for PO-2025-0068" },
  ];

  for (const log of logs) {
    db.insert(schema.activityLogs).values(log).run();
  }

  console.log("Seed complete.");
  client.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
