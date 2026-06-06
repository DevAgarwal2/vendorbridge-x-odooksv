"use client";

import { PrintDownloadActions } from "@/components/print-download-actions";
import { usePrint } from "@/components/printable";
import { generateRfqPDF, downloadPDF } from "@/lib/pdf";

type Props = {
  rfqId: number;
  title: string;
  category: string;
  description?: string | null;
  status: string;
  deadline: number | Date | null;
  createdAt: number | Date | null;
  items: { itemName: string; quantity: number; unit: string }[];
  assignedVendorNames: string[];
};

export function RfqPdfActions(props: Props) {
  const handlePrint = usePrint();

  const handleDownload = () => {
    const doc = generateRfqPDF({
      rfqId: props.rfqId,
      title: props.title,
      category: props.category,
      description: props.description,
      status: props.status,
      deadline: props.deadline,
      createdAt: props.createdAt,
      items: props.items,
      assignedVendorNames: props.assignedVendorNames,
    });
    downloadPDF(doc, `RFQ-${props.rfqId}`);
  };

  return (
    <PrintDownloadActions
      onPrint={handlePrint}
      onDownload={handleDownload}
    />
  );
}
