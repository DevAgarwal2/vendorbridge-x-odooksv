"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COMPANY = {
  name: "Your Organization Name",
  address: "123 Business Park, Ahmedabad, India",
  gstin: "25AABCS1429B1Z0",
  email: "procurement@vendorbridge.io",
  phone: "+91 79 4000 1234",
};

const COLORS = {
  primary: "#0f172a",
  accent: "#2563eb",
  text: "#1e293b",
  muted: "#64748b",
  border: "#cbd5e1",
  bg: "#f8fafc",
};

const fmtINR = (n: number | null | undefined) => {
  if (n == null) return "—";
  return `Rs. ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const fmtDate = (d: Date | number | null | undefined) => {
  if (!d) return "—";
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function addHeader(doc: jsPDF, title: string, docNumber: string) {
  // Company name and address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(COLORS.primary);
  doc.text(COMPANY.name, 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted);
  doc.text(COMPANY.address, 14, 26);
  doc.text(`GSTIN: ${COMPANY.gstin}`, 14, 31);
  doc.text(`${COMPANY.email} | ${COMPANY.phone}`, 14, 36);

  // Document title (right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(COLORS.accent);
  doc.text(title.toUpperCase(), 196, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  doc.text(docNumber, 196, 27, { align: "right" });

  // Horizontal divider
  doc.setDrawColor(COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(14, 42, 196, 42);
}

function addFooter(doc: jsPDF, docNumber: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(14, 282, 196, 282);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text(
      `Generated on ${new Date().toLocaleString("en-IN")} | ${docNumber}`,
      14,
      287
    );
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: "right" });
  }
}

function addTwoColumn(
  doc: jsPDF,
  startY: number,
  leftTitle: string,
  leftLines: string[],
  rightTitle: string,
  rightLines: string[]
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted);
  doc.text(leftTitle.toUpperCase(), 14, startY);
  doc.text(rightTitle.toUpperCase(), 120, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(COLORS.text);
  let ly = startY + 6;
  for (const line of leftLines) {
    doc.text(line, 14, ly);
    ly += 5;
  }
  let ry = startY + 6;
  for (const line of rightLines) {
    doc.text(line, 120, ry);
    ry += 5;
  }
}

function addTotalsBox(
  doc: jsPDF,
  startY: number,
  rows: { label: string; value: string; bold?: boolean; accent?: boolean }[]
) {
  const boxX = 120;
  const boxWidth = 76;
  const rowHeight = 7;

  doc.setDrawColor(COLORS.border);
  doc.setFillColor(COLORS.bg);

  rows.forEach((row, idx) => {
    const y = startY + idx * rowHeight;
    if (row.bold) {
      doc.setFillColor(COLORS.primary);
      doc.rect(boxX, y - 1, boxWidth, rowHeight, "F");
    }
    doc.setFont("helvetica", row.bold ? "bold" : "normal");
    doc.setFontSize(row.bold ? 11 : 10);
    doc.setTextColor(row.bold ? "#ffffff" : row.accent ? COLORS.accent : COLORS.text);
    doc.text(row.label, boxX + 3, y + 4);
    doc.text(row.value, boxX + boxWidth - 3, y + 4, { align: "right" });
  });

  if (rows.some((r) => r.bold)) {
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(boxX, startY + rowHeight * (rows.length - 1) - 2, boxX + boxWidth, startY + rowHeight * (rows.length - 1) - 2);
  }
}

type POItem = { itemName: string; quantity: number; unitPrice: number; total: number };
type Vendor = { name: string; address?: string | null; gstNumber?: string | null; email?: string | null; contactNumber?: string | null };

export function generatePurchaseOrderPDF(data: {
  poNumber: string;
  status: string;
  createdAt: Date | number | null;
  dueDate: Date | number | null;
  vendor: Vendor | null | undefined;
  items: POItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}) {
  const doc = new jsPDF();
  addHeader(doc, "Purchase Order", data.poNumber);

  addTwoColumn(
    doc,
    52,
    "Vendor",
    [
      data.vendor?.name || "—",
      data.vendor?.address || "—",
      data.vendor?.gstNumber ? `GSTIN: ${data.vendor.gstNumber}` : "",
      data.vendor?.email || "",
    ].filter(Boolean),
    "Order Details",
    [
      `PO Number: ${data.poNumber}`,
      `Date: ${fmtDate(data.createdAt)}`,
      `Status: ${data.status.toUpperCase()}`,
      `Due: ${fmtDate(data.dueDate)}`,
    ]
  );

  autoTable(doc, {
    startY: 88,
    head: [["#", "Item Description", "Qty", "Unit Price", "Total"]],
    body: data.items.map((item, idx) => [
      String(idx + 1),
      item.itemName,
      String(item.quantity),
      fmtINR(item.unitPrice),
      fmtINR(item.total),
    ]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 200;
  addTotalsBox(doc, finalY + 8, [
    { label: "Subtotal", value: fmtINR(data.subtotal) },
    { label: "CGST (9%)", value: fmtINR(data.cgst) },
    { label: "SGST (9%)", value: fmtINR(data.sgst) },
    { label: "Grand Total", value: fmtINR(data.grandTotal), bold: true },
  ]);

  // Signature lines
  const sigY = 245;
  doc.setDrawColor(COLORS.border);
  doc.line(14, sigY, 80, sigY);
  doc.line(130, sigY, 196, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted);
  doc.text("Authorized Signatory (Buyer)", 14, sigY + 5);
  doc.text("Vendor Signature & Stamp", 130, sigY + 5);

  addFooter(doc, data.poNumber);
  return doc;
}

export function generateInvoicePDF(data: {
  invoiceNumber: string;
  poNumber: string;
  status: string;
  createdAt: Date | number | null;
  dueDate: Date | number | null;
  paidAt: Date | number | null | undefined;
  vendor: Vendor | null | undefined;
  items: POItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}) {
  const doc = new jsPDF();
  addHeader(doc, "Tax Invoice", data.invoiceNumber);

  addTwoColumn(
    doc,
    52,
    "Vendor (Bill From)",
    [
      data.vendor?.name || "—",
      data.vendor?.address || "—",
      data.vendor?.gstNumber ? `GSTIN: ${data.vendor.gstNumber}` : "",
      data.vendor?.email || "",
    ].filter(Boolean),
    "Invoice Details",
    [
      `Invoice #: ${data.invoiceNumber}`,
      `Reference PO: ${data.poNumber || "—"}`,
      `Issued: ${fmtDate(data.createdAt)}`,
      `Due Date: ${fmtDate(data.dueDate)}`,
      `Status: ${data.status.toUpperCase()}`,
    ]
  );

  autoTable(doc, {
    startY: 88,
    head: [["#", "Item Description", "Qty", "Unit Price", "Total"]],
    body: data.items.map((item, idx) => [
      String(idx + 1),
      item.itemName,
      String(item.quantity),
      fmtINR(item.unitPrice),
      fmtINR(item.total),
    ]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 200;
  addTotalsBox(doc, finalY + 8, [
    { label: "Subtotal", value: fmtINR(data.subtotal) },
    { label: "CGST (9%)", value: fmtINR(data.cgst) },
    { label: "SGST (9%)", value: fmtINR(data.sgst) },
    { label: "Grand Total", value: fmtINR(data.grandTotal), bold: true },
  ]);

  if (data.status === "paid" && data.paidAt) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor("#16a34a");
    doc.text(`PAID on ${fmtDate(data.paidAt)}`, 14, 252);
  }

  addFooter(doc, data.invoiceNumber);
  return doc;
}

export function generateQuotationPDF(data: {
  quotationId: number;
  rfqTitle: string;
  vendorName: string;
  status: string;
  items: { itemName: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  grandTotal: number;
  deliveryDays: number;
  paymentTerms: string;
  notes?: string | null;
  createdAt: Date | number | null;
}) {
  const doc = new jsPDF();
  addHeader(doc, "Quotation", `Q-${data.quotationId}`);

  addTwoColumn(
    doc,
    52,
    "Vendor",
    [data.vendorName, `RFQ: ${data.rfqTitle}`],
    "Quotation Details",
    [
      `Quote ID: Q-${data.quotationId}`,
      `Date: ${fmtDate(data.createdAt)}`,
      `Status: ${data.status.toUpperCase()}`,
      `Delivery: ${data.deliveryDays} days`,
    ]
  );

  autoTable(doc, {
    startY: 80,
    head: [["#", "Item", "Qty", "Unit Price", "Total"]],
    body: data.items.map((item, idx) => [
      String(idx + 1),
      item.itemName,
      String(item.quantity),
      fmtINR(item.unitPrice),
      fmtINR(item.total),
    ]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 180;
  addTotalsBox(doc, finalY + 8, [
    { label: "Subtotal", value: fmtINR(data.subtotal) },
    { label: `GST (${data.gstPercent}%)`, value: fmtINR(data.gstAmount) },
    { label: "Grand Total", value: fmtINR(data.grandTotal), bold: true },
  ]);

  // Payment terms + notes
  const notesY = finalY + 8 + 7 * 4 + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLORS.muted);
  doc.text("PAYMENT TERMS", 14, notesY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.text);
  doc.text(data.paymentTerms, 14, notesY + 5);

  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLORS.muted);
    doc.text("NOTES", 14, notesY + 14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.text);
    const wrapped = doc.splitTextToSize(data.notes, 180);
    doc.text(wrapped, 14, notesY + 19);
  }

  addFooter(doc, `Q-${data.quotationId}`);
  return doc;
}

export function generateRfqPDF(data: {
  rfqId: number;
  title: string;
  category: string;
  description?: string | null;
  status: string;
  deadline: Date | number | null;
  createdAt: Date | number | null;
  items: { itemName: string; quantity: number; unit: string }[];
  assignedVendorNames: string[];
}) {
  const doc = new jsPDF();
  addHeader(doc, "Request for Quotation", `RFQ-${data.rfqId}`);

  addTwoColumn(
    doc,
    52,
    "RFQ Details",
    [
      `Title: ${data.title}`,
      `Category: ${data.category}`,
      `Status: ${data.status.toUpperCase()}`,
      `Created: ${fmtDate(data.createdAt)}`,
    ],
    "Submission",
    [
      `Deadline: ${fmtDate(data.deadline)}`,
      `Vendors: ${data.assignedVendorNames.length}`,
      `Items: ${data.items.length}`,
      "",
    ]
  );

  if (data.description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted);
    doc.text("DESCRIPTION", 14, 80);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.text);
    const wrapped = doc.splitTextToSize(data.description, 180);
    doc.text(wrapped, 14, 85);
  }

  const startY = data.description ? 105 : 88;

  autoTable(doc, {
    startY,
    head: [["#", "Item", "Quantity", "Unit"]],
    body: data.items.map((item, idx) => [
      String(idx + 1),
      item.itemName,
      String(item.quantity),
      item.unit,
    ]),
    headStyles: {
      fillColor: COLORS.primary,
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.bg },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      2: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 200;

  // Vendors list
  if (data.assignedVendorNames.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(COLORS.muted);
    doc.text("ASSIGNED VENDORS", 14, finalY + 12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLORS.text);
    doc.setFontSize(9);
    data.assignedVendorNames.forEach((name, idx) => {
      doc.text(`• ${name}`, 14, finalY + 18 + idx * 5);
    });
  }

  addFooter(doc, `RFQ-${data.rfqId}`);
  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}.pdf`);
}

export function openPDFInNewTab(doc: jsPDF) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type ReportData = {
  period: { from: Date; to: Date; generatedAt: Date };
  spending: { thisMonth: number; lastMonth: number; allTime: number };
  vendors: { active: number; total: number };
  purchaseOrders: { total: number; paid: number; pending: number; fulfillmentRate: number };
  invoices: { total: number; paid: number; overdue: number; pendingValue: number; paymentRate: number };
  rfqs: { total: number; sent: number; closed: number };
  quotations: { total: number; pending: number };
  months: { month: string; amount: number; poCount: number }[];
  topVendors: { name: string; totalSpend: number; poCount: number }[];
  poStatusBreakdown: { status: string; count: number }[];
  recentActivity: { type: string; title: string; description: string; createdAt: Date | number }[];
};

const fmtINRCompact = (n: number) => {
  if (n >= 10000000) return `Rs. ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `Rs. ${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)} K`;
  return `Rs. ${n.toLocaleString("en-IN")}`;
};

const fmtPct = (n: number) => `${n}%`;

const STATUS_COLORS: Record<string, [number, number, number]> = {
  draft: [148, 163, 184],
  sent: [59, 130, 246],
  accepted: [16, 185, 129],
  rejected: [239, 68, 68],
  pending_payment: [245, 158, 11],
  paid: [34, 197, 94],
  closed: [100, 116, 139],
  open: [59, 130, 246],
  submitted: [99, 102, 241],
  approved: [16, 185, 129],
};

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return [0, 0, 0];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

function statusColor(status: string): [number, number, number] {
  return STATUS_COLORS[status] ?? hexToRgb(COLORS.muted);
}

function drawCoverPage(doc: jsPDF, data: ReportData) {
  // Top accent bar
  doc.setFillColor(...hexToRgb(COLORS.accent));
  doc.rect(0, 0, 210, 6, "F");

  // Brand block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(COLORS.accent));
  doc.text("VENDORBRIDGE", 14, 18);

  // Big title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text("Procurement", 14, 50);
  doc.text("Analytics Report", 14, 64);

  // Accent line
  doc.setDrawColor(...hexToRgb(COLORS.accent));
  doc.setLineWidth(1.2);
  doc.line(14, 72, 80, 72);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(COLORS.text));
  doc.text("Comprehensive insights into spending, vendors,", 14, 82);
  doc.text("purchase orders, and invoice performance.", 14, 88);

  // Report meta box
  const metaY = 110;
  doc.setFillColor(...hexToRgb(COLORS.bg));
  doc.roundedRect(14, metaY, 182, 60, 3, 3, "F");
  doc.setDrawColor(...hexToRgb(COLORS.border));
  doc.roundedRect(14, metaY, 182, 60, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(COLORS.muted));
  doc.text("REPORTING PERIOD", 22, metaY + 10);
  doc.text("GENERATED ON", 22, metaY + 26);
  doc.text("PREPARED BY", 22, metaY + 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...hexToRgb(COLORS.text));
  doc.text(`${fmtDate(data.period.from)} — ${fmtDate(data.period.to)}`, 22, metaY + 18);
  doc.text(data.period.generatedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }), 22, metaY + 34);
  doc.text("VendorBridge Procurement Team", 22, metaY + 50);

  // Footer signature area
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(COLORS.muted));
  doc.text("This report was auto-generated by VendorBridge ERP.", 14, 285);
  doc.text(`Page 1 — ${doc.getNumberOfPages()}`, 196, 285, { align: "right" });
}

function drawExecutiveSummary(doc: jsPDF, data: ReportData) {
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text("Executive Summary", 14, 22);

  doc.setDrawColor(...hexToRgb(COLORS.accent));
  doc.setLineWidth(0.6);
  doc.line(14, 26, 60, 26);

  // KPI Cards (2x2 grid)
  const kpis = [
    {
      label: "Total Spend (This Month)",
      value: fmtINRCompact(data.spending.thisMonth),
      sub: data.spending.lastMonth > 0
        ? `${(((data.spending.thisMonth - data.spending.lastMonth) / data.spending.lastMonth) * 100).toFixed(1)}% vs last month`
        : "First month of data",
      color: hexToRgb(COLORS.accent),
    },
    {
      label: "Active Vendors",
      value: String(data.vendors.active),
      sub: `${data.vendors.total} total vendors on platform`,
      color: hexToRgb("#10b981"),
    },
    {
      label: "PO Fulfillment Rate",
      value: fmtPct(data.purchaseOrders.fulfillmentRate),
      sub: `${data.purchaseOrders.paid} of ${data.purchaseOrders.total} purchase orders paid`,
      color: hexToRgb("#0ea5e9"),
    },
    {
      label: "Overdue Invoices",
      value: String(data.invoices.overdue),
      sub: `${fmtINRCompact(data.invoices.pendingValue)} pending payment value`,
      color: data.invoices.overdue > 0 ? hexToRgb("#ef4444") : hexToRgb("#10b981"),
    },
  ];

  const cardW = 88;
  const cardH = 38;
  const gapX = 6;
  const gapY = 6;
  const startX = 14;
  const startY = 38;

  kpis.forEach((kpi, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    // Card background
    doc.setFillColor(...hexToRgb(COLORS.bg));
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");

    // Left accent bar
    doc.setFillColor(...kpi.color);
    doc.roundedRect(x, y, 3, cardH, 1.5, 1.5, "F");

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(COLORS.muted));
    doc.text(kpi.label.toUpperCase(), x + 8, y + 9);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...hexToRgb(COLORS.primary));
    doc.text(kpi.value, x + 8, y + 24);

    // Sub
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...kpi.color);
    doc.setFont("helvetica", "italic");
    doc.text(doc.splitTextToSize(kpi.sub, cardW - 12)[0] ?? "", x + 8, y + 32);
  });

  // Highlights section
  const highY = startY + 2 * (cardH + gapY) + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text("KEY HIGHLIGHTS", 14, highY);

  const highlights = [
    `${data.purchaseOrders.total} purchase orders issued • ${data.purchaseOrders.paid} fully paid • ${data.purchaseOrders.pending} awaiting payment`,
    `${data.rfqs.total} RFQs created • ${data.rfqs.sent} sent to vendors • ${data.rfqs.closed} closed`,
    `${data.quotations.total} quotations received • ${data.quotations.pending} pending review`,
    `All-time procurement value: ${fmtINRCompact(data.spending.allTime)} across the VendorBridge platform`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(COLORS.text));
  let hy = highY + 8;
  highlights.forEach((h) => {
    doc.setFillColor(...hexToRgb(COLORS.accent));
    doc.circle(17, hy - 1.5, 1, "F");
    const wrapped = doc.splitTextToSize(h, 175);
    doc.text(wrapped, 22, hy);
    hy += 6 + (wrapped.length - 1) * 5;
  });
}

function drawSpendingChart(doc: jsPDF, data: ReportData) {
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text("Spending Trends", 14, 22);
  doc.setDrawColor(...hexToRgb(COLORS.accent));
  doc.setLineWidth(0.6);
  doc.line(14, 26, 60, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(COLORS.muted));
  doc.text("Monthly procurement spend over the last 6 months", 14, 33);

  // Draw bar chart
  const chartX = 14;
  const chartY = 50;
  const chartW = 182;
  const chartH = 100;

  // Chart background
  doc.setFillColor(...hexToRgb(COLORS.bg));
  doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, "F");

  const maxAmount = Math.max(...data.months.map((m) => m.amount), 1);
  const barCount = data.months.length;
  const padding = 16;
  const innerW = chartW - padding * 2;
  const innerH = chartH - 30;
  const barW = (innerW / barCount) * 0.6;
  const barGap = (innerW / barCount) * 0.4;

  data.months.forEach((m, idx) => {
    const barH = maxAmount > 0 ? (m.amount / maxAmount) * innerH : 0;
    const x = chartX + padding + idx * (barW + barGap) + barGap / 2;
    const y = chartY + 22 + (innerH - barH);

    // Bar
    doc.setFillColor(...hexToRgb(COLORS.accent));
    doc.roundedRect(x, y, barW, barH, 1, 1, "F");

    // Amount label on top
    if (m.amount > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...hexToRgb(COLORS.primary));
      doc.text(fmtINRCompact(m.amount), x + barW / 2, y - 2, { align: "center" });
    }

    // Month label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(COLORS.text));
    doc.text(m.month, x + barW / 2, chartY + chartH - 6, { align: "center" });

    // PO count sub-label
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(COLORS.muted));
    doc.text(`${m.poCount} PO${m.poCount === 1 ? "" : "s"}`, x + barW / 2, chartY + chartH - 1, { align: "center" });
  });

  // Totals table below chart
  const totalAmount = data.months.reduce((s, m) => s + m.amount, 0);
  const totalPos = data.months.reduce((s, m) => s + m.poCount, 0);
  const avgAmount = totalPos > 0 ? totalAmount / totalPos : 0;

  autoTable(doc, {
    startY: chartY + chartH + 12,
    head: [["Metric", "Value"]],
    body: [
      ["Total 6-month spend", fmtINRCompact(totalAmount)],
      ["Total purchase orders", String(totalPos)],
      ["Average PO value", fmtINRCompact(avgAmount)],
      ["Peak month", data.months.reduce((max, m) => (m.amount > max.amount ? m : max), data.months[0]).month],
      ["Lowest month", data.months.reduce((min, m) => (m.amount < min.amount ? m : min), data.months[0]).month],
    ],
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10, textColor: hexToRgb(COLORS.text) },
    alternateRowStyles: { fillColor: hexToRgb(COLORS.bg) },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
    tableWidth: 100,
  });
}

function drawTopVendors(doc: jsPDF, data: ReportData) {
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text("Top Vendors", 14, 22);
  doc.setDrawColor(...hexToRgb(COLORS.accent));
  doc.setLineWidth(0.6);
  doc.line(14, 26, 60, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(COLORS.muted));
  doc.text("Highest-spending vendors ranked by total procurement value", 14, 33);

  if (data.topVendors.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(COLORS.muted));
    doc.text("No vendor data available for this period.", 14, 60);
    return;
  }

  const totalSpend = data.topVendors.reduce((s, v) => s + v.totalSpend, 0);

  autoTable(doc, {
    startY: 42,
    head: [["Rank", "Vendor", "POs", "Total Spend", "% of Total"]],
    body: data.topVendors.map((v, idx) => {
      const pct = totalSpend > 0 ? ((v.totalSpend / totalSpend) * 100).toFixed(1) : "0.0";
      return [
        String(idx + 1),
        v.name,
        String(v.poCount),
        fmtINR(v.totalSpend),
        `${pct}%`,
      ];
    }),
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10, textColor: hexToRgb(COLORS.text) },
    alternateRowStyles: { fillColor: hexToRgb(COLORS.bg) },
    columnStyles: {
      0: { halign: "center", cellWidth: 14, fontStyle: "bold" },
      2: { halign: "center" },
      3: { halign: "right", fontStyle: "bold" },
      4: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (hookData) => {
      // Highlight top 3 with accent
      if (hookData.section === "body" && hookData.column.index === 0) {
        const rank = parseInt(String(hookData.cell.raw ?? "0"));
        if (rank === 1) {
          hookData.cell.styles.fillColor = hexToRgb("#fbbf24");
          hookData.cell.styles.textColor = [120, 53, 15];
        } else if (rank === 2) {
          hookData.cell.styles.fillColor = hexToRgb("#cbd5e1");
          hookData.cell.styles.textColor = [30, 41, 59];
        } else if (rank === 3) {
          hookData.cell.styles.fillColor = hexToRgb("#fdba74");
          hookData.cell.styles.textColor = [124, 45, 18];
        }
      }
    },
  });
}

function drawStatusBreakdown(doc: jsPDF, data: ReportData) {
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text("Status Breakdown", 14, 22);
  doc.setDrawColor(...hexToRgb(COLORS.accent));
  doc.setLineWidth(0.6);
  doc.line(14, 26, 60, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(COLORS.muted));
  doc.text("Current status of all purchase orders in the system", 14, 33);

  if (data.poStatusBreakdown.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(COLORS.muted));
    doc.text("No purchase orders to report.", 14, 60);
    return;
  }

  const total = data.poStatusBreakdown.reduce((s, x) => s + x.count, 0);

  // Stacked horizontal bar
  const barX = 14;
  const barY = 50;
  const barW = 182;
  const barH = 24;
  let cursor = barX;
  data.poStatusBreakdown.forEach((s) => {
    const w = total > 0 ? (s.count / total) * barW : 0;
    doc.setFillColor(...statusColor(s.status));
    doc.rect(cursor, barY, w, barH, "F");
    cursor += w;
  });

  // Legend with percentages
  let ly = barY + barH + 12;
  data.poStatusBreakdown.forEach((s) => {
    doc.setFillColor(...statusColor(s.status));
    doc.roundedRect(14, ly - 4, 8, 6, 1, 1, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...hexToRgb(COLORS.text));
    const label = s.status.replace(/_/g, " ");
    doc.text(label.charAt(0).toUpperCase() + label.slice(1), 26, ly);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...hexToRgb(COLORS.primary));
    const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : "0.0";
    doc.text(`${s.count}  •  ${pct}%`, 196, ly, { align: "right" });
    ly += 8;
  });

  // Detail table
  autoTable(doc, {
    startY: ly + 6,
    head: [["Status", "Count", "Percentage"]],
    body: data.poStatusBreakdown.map((s) => {
      const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : "0.0";
      const label = s.status.replace(/_/g, " ");
      return [
        label.charAt(0).toUpperCase() + label.slice(1),
        String(s.count),
        `${pct}%`,
      ];
    }),
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10, textColor: hexToRgb(COLORS.text) },
    alternateRowStyles: { fillColor: hexToRgb(COLORS.bg) },
    columnStyles: {
      1: { halign: "center", fontStyle: "bold" },
      2: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });
}

function drawActivityLog(doc: jsPDF, data: ReportData) {
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...hexToRgb(COLORS.primary));
  doc.text("Recent Activity", 14, 22);
  doc.setDrawColor(...hexToRgb(COLORS.accent));
  doc.setLineWidth(0.6);
  doc.line(14, 26, 60, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(COLORS.muted));
  doc.text("Latest events logged on the platform", 14, 33);

  if (data.recentActivity.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(COLORS.muted));
    doc.text("No recent activity to display.", 14, 60);
    return;
  }

  autoTable(doc, {
    startY: 42,
    head: [["When", "Type", "Event", "Details"]],
    body: data.recentActivity.map((a) => [
      fmtDate(a.createdAt),
      (a.type || "").replace(/_/g, " "),
      a.title,
      a.description || "—",
    ]),
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: "#ffffff",
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: hexToRgb(COLORS.text) },
    alternateRowStyles: { fillColor: hexToRgb(COLORS.bg) },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 32, fontStyle: "italic" },
      2: { cellWidth: 50, fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });
}

export function generateReportPDF(data: ReportData) {
  const doc = new jsPDF();

  drawCoverPage(doc, data);
  drawExecutiveSummary(doc, data);
  drawSpendingChart(doc, data);
  drawTopVendors(doc, data);
  drawStatusBreakdown(doc, data);
  drawActivityLog(doc, data);

  // Apply page footers on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...hexToRgb(COLORS.border));
    doc.setLineWidth(0.2);
    doc.line(14, 282, 196, 282);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(COLORS.muted));
    const periodLabel = `${fmtDate(data.period.from)} — ${fmtDate(data.period.to)}`;
    doc.text(`VendorBridge • Procurement Report • ${periodLabel}`, 14, 287);
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: "right" });
  }

  return doc;
}

