"use client";

import { PrintDownloadActions } from "@/components/print-download-actions";
import { usePrint } from "@/components/printable";
import { generateInvoicePDF, downloadPDF } from "@/lib/pdf";
import { toast } from "sonner";

type InvoiceItem = { itemName: string; quantity: number; unitPrice: number; total: number };
type Vendor = { name: string; address?: string | null; gstNumber?: string | null; email?: string | null; contactNumber?: string | null };

type Props = {
  invoiceNumber: string;
  poNumber: string;
  status: string;
  createdAt: number | Date;
  dueDate: number | Date | null;
  paidAt: number | Date | null | undefined;
  vendor: Vendor | null | undefined;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
};

export function InvoicePdfActions(props: Props) {
  const handlePrint = usePrint();

  const handleDownload = () => {
    const doc = generateInvoicePDF({
      invoiceNumber: props.invoiceNumber,
      poNumber: props.poNumber,
      status: props.status,
      createdAt: props.createdAt,
      dueDate: props.dueDate,
      paidAt: props.paidAt,
      vendor: props.vendor,
      items: props.items,
      subtotal: props.subtotal,
      cgst: props.cgst,
      sgst: props.sgst,
      grandTotal: props.grandTotal,
    });
    downloadPDF(doc, props.invoiceNumber);
  };

  const handleEmail = async () => {
    const email = props.vendor?.email;
    if (!email) {
      toast.error("Vendor has no email on file. Add an email to the vendor profile to enable emailing.");
      return;
    }
    const subject = `Invoice ${props.invoiceNumber} from VendorBridge`;
    const body = [
      `Dear ${props.vendor?.name || "Vendor"},`,
      "",
      `Please find attached invoice ${props.invoiceNumber} for PO ${props.poNumber}.`,
      "",
      `Amount Due: Rs. ${props.grandTotal.toLocaleString("en-IN")}`,
      `Due Date: ${props.dueDate ? new Date(props.dueDate).toLocaleDateString("en-IN") : "—"}`,
      "",
      "Thank you for your business.",
      "",
      "Best regards,",
      "Procurement Team",
    ].join("\n");

    const doc = generateInvoicePDF({
      invoiceNumber: props.invoiceNumber,
      poNumber: props.poNumber,
      status: props.status,
      createdAt: props.createdAt,
      dueDate: props.dueDate,
      paidAt: props.paidAt,
      vendor: props.vendor,
      items: props.items,
      subtotal: props.subtotal,
      cgst: props.cgst,
      sgst: props.sgst,
      grandTotal: props.grandTotal,
    });
    downloadPDF(doc, props.invoiceNumber);

    setTimeout(() => {
      const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      toast.success(`Invoice downloaded & email to ${email} ready to send`);
    }, 500);
  };

  return (
    <PrintDownloadActions
      onPrint={handlePrint}
      onDownload={handleDownload}
      onEmail={handleEmail}
      showEmail={true}
    />
  );
}
