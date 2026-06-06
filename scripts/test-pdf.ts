// Test that PDF generation works
import { generatePurchaseOrderPDF, generateInvoicePDF, generateRfqPDF, generateQuotationPDF } from "../lib/pdf";
import fs from "fs";

console.log("=== PDF Generation Test ===\n");

// 1. Test PO PDF
console.log("1. Generate Purchase Order PDF");
const poDoc = generatePurchaseOrderPDF({
  poNumber: "PO-2026-1234",
  status: "approved",
  createdAt: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  vendor: {
    name: "Test Vendor Ltd",
    address: "456 Test Street, Mumbai",
    gstNumber: "22AAAAA0000A1Z5",
    email: "vendor@test.com",
  },
  items: [
    { itemName: "Laptop", quantity: 5, unitPrice: 60000, total: 300000 },
    { itemName: "Monitor", quantity: 5, unitPrice: 40000, total: 200000 },
    { itemName: "Keyboard", quantity: 5, unitPrice: 5000, total: 25000 },
  ],
  subtotal: 525000,
  cgst: 47250,
  sgst: 47250,
  grandTotal: 619500,
});

const poBuffer = Buffer.from(poDoc.output("arraybuffer"));
console.log(`   PDF size: ${poBuffer.length} bytes`);
console.log(`   ${poBuffer.length > 1000 ? "PASS" : "FAIL"} - PDF generated successfully`);
fs.writeFileSync("/tmp/test-po.pdf", poBuffer);
console.log("   Saved to /tmp/test-po.pdf");

// 2. Test Invoice PDF
console.log("\n2. Generate Invoice PDF");
const invDoc = generateInvoicePDF({
  invoiceNumber: "INV-2026-5678",
  poNumber: "PO-2026-1234",
  status: "pending_payment",
  createdAt: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  paidAt: null,
  vendor: {
    name: "Test Vendor Ltd",
    address: "456 Test Street, Mumbai",
    gstNumber: "22AAAAA0000A1Z5",
    email: "vendor@test.com",
  },
  items: [
    { itemName: "Laptop", quantity: 5, unitPrice: 60000, total: 300000 },
  ],
  subtotal: 300000,
  cgst: 27000,
  sgst: 27000,
  grandTotal: 354000,
});
const invBuffer = Buffer.from(invDoc.output("arraybuffer"));
console.log(`   PDF size: ${invBuffer.length} bytes`);
console.log(`   ${invBuffer.length > 1000 ? "PASS" : "FAIL"} - PDF generated`);
fs.writeFileSync("/tmp/test-invoice.pdf", invBuffer);

// 3. Test RFQ PDF
console.log("\n3. Generate RFQ PDF");
const rfqDoc = generateRfqPDF({
  rfqId: 42,
  title: "Office Furniture Procurement Q2",
  category: "Furniture",
  description: "Need 10 ergonomic chairs and 5 standing desks for the new office.",
  status: "sent",
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  items: [
    { itemName: "Ergonomic Chair", quantity: 10, unit: "NOS" },
    { itemName: "Standing Desk", quantity: 5, unit: "NOS" },
  ],
  assignedVendorNames: ["Vendor A", "Vendor B", "Vendor C"],
});
const rfqBuffer = Buffer.from(rfqDoc.output("arraybuffer"));
console.log(`   PDF size: ${rfqBuffer.length} bytes`);
console.log(`   ${rfqBuffer.length > 1000 ? "PASS" : "FAIL"} - PDF generated`);
fs.writeFileSync("/tmp/test-rfq.pdf", rfqBuffer);

// 4. Test Quotation PDF
console.log("\n4. Generate Quotation PDF");
const qDoc = generateQuotationPDF({
  quotationId: 99,
  rfqTitle: "Office Furniture Procurement Q2",
  vendorName: "Test Vendor Ltd",
  status: "submitted",
  items: [
    { itemName: "Ergonomic Chair", quantity: 10, unitPrice: 12000, total: 120000 },
    { itemName: "Standing Desk", quantity: 5, unitPrice: 35000, total: 175000 },
  ],
  subtotal: 295000,
  gstPercent: 18,
  gstAmount: 53100,
  grandTotal: 348100,
  deliveryDays: 14,
  paymentTerms: "30 days net",
  notes: "Delivery within 2 weeks. Installation included.",
  createdAt: new Date(),
});
const qBuffer = Buffer.from(qDoc.output("arraybuffer"));
console.log(`   PDF size: ${qBuffer.length} bytes`);
console.log(`   ${qBuffer.length > 1000 ? "PASS" : "FAIL"} - PDF generated`);
fs.writeFileSync("/tmp/test-quotation.pdf", qBuffer);

// 5. Verify all PDFs are valid
console.log("\n5. Verify PDF magic bytes");
const pdfHeader = "%PDF-";
const files = ["/tmp/test-po.pdf", "/tmp/test-invoice.pdf", "/tmp/test-rfq.pdf", "/tmp/test-quotation.pdf"];
let allValid = true;
for (const f of files) {
  const buf = fs.readFileSync(f);
  const header = buf.slice(0, 5).toString("ascii");
  const ok = header === pdfHeader;
  if (!ok) allValid = false;
  console.log(`   ${ok ? "PASS" : "FAIL"} - ${f}: header="${header}"`);
}

console.log(`\n=== ${allValid ? "All PDF tests PASSED" : "Some PDF tests FAILED"} ===`);
process.exit(allValid ? 0 : 1);
