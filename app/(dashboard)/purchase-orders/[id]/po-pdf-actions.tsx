"use client";

import { PrintDownloadActions } from "@/components/print-download-actions";
import { usePrint } from "@/components/printable";
import { generatePurchaseOrderPDF, downloadPDF } from "@/lib/pdf";

type POItem = { itemName: string; quantity: number; unitPrice: number; total: number };
type Vendor = { name: string; address?: string | null; gstNumber?: string | null; email?: string | null; contactNumber?: string | null };

type Props = {
  poNumber: string;
  status: string;
  createdAt: number | Date;
  dueDate: number | Date | null;
  vendor: Vendor | null | undefined;
  items: POItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
};

export function PoPdfActions(props: Props) {
  const handlePrint = usePrint();

  const handleDownload = () => {
    const doc = generatePurchaseOrderPDF({
      poNumber: props.poNumber,
      status: props.status,
      createdAt: props.createdAt,
      dueDate: props.dueDate,
      vendor: props.vendor,
      items: props.items,
      subtotal: props.subtotal,
      cgst: props.cgst,
      sgst: props.sgst,
      grandTotal: props.grandTotal,
    });
    downloadPDF(doc, props.poNumber);
  };

  return (
    <PrintDownloadActions
      onPrint={handlePrint}
      onDownload={handleDownload}
    />
  );
}
