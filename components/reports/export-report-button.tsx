"use client";

import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Download, FileText, ChevronDown, Loader2, Mail } from "lucide-react";
import { generateReportPDF, downloadPDF } from "@/lib/pdf";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ReportData = Parameters<typeof generateReportPDF>[0];

export function ExportReportButton({ data }: { data: ReportData }) {
  const [loading, setLoading] = useState(false);
  const filename = `VendorBridge-Report-${data.period.generatedAt.toISOString().slice(0, 10)}`;

  const handleDownload = () => {
    setLoading(true);
    try {
      const doc = generateReportPDF(data);
      downloadPDF(doc, filename);
      toast.success("Report PDF downloaded", {
        description: `${filename}.pdf — 6-page analytics report`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF", { description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setLoading(true);
    try {
      const doc = generateReportPDF(data);
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      if (!w) {
        toast.error("Pop-up blocked", { description: "Allow pop-ups to print the report." });
      } else {
        w.addEventListener("load", () => {
          w.print();
        });
        toast.success("Opening print preview", {
          description: "Use your browser's print dialog to save as PDF or print.",
        });
      }
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to open print view", { description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = () => {
    setLoading(true);
    try {
      const doc = generateReportPDF(data);
      downloadPDF(doc, filename);
      const periodLabel = `${data.period.from.toLocaleDateString("en-IN", { dateStyle: "medium" })} — ${data.period.to.toLocaleDateString("en-IN", { dateStyle: "medium" })}`;
      const subject = encodeURIComponent(`VendorBridge Procurement Report — ${periodLabel}`);
      const body = encodeURIComponent(
        `Hi,\n\nPlease find attached the VendorBridge procurement report for the period ${periodLabel}.\n\nKey highlights:\n• This month spend: Rs. ${data.spending.thisMonth.toLocaleString("en-IN")}\n• PO fulfillment: ${data.purchaseOrders.fulfillmentRate}%\n• Active vendors: ${data.vendors.active}\n• Overdue invoices: ${data.invoices.overdue}\n\nThe full PDF (${filename}.pdf) has been downloaded to your machine.\n\nBest,\nVendorBridge Team`
      );
      setTimeout(() => {
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        toast.success("Email draft opened", {
          description: "PDF downloaded — attach it to the email draft.",
        });
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to prepare email", { description: String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        className={cn(
          "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
          "h-8 px-3 shadow-sm",
          "bg-primary text-primary-foreground",
          "transition-all outline-none",
          "hover:bg-primary/90",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export
        <ChevronDown className="h-3 w-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs">Export report</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDownload} className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4 text-blue-600" />
            <div className="flex flex-col">
              <span className="font-medium">Download as PDF</span>
              <span className="text-xs text-muted-foreground">6-page formatted report</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint} className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4 text-emerald-600" />
            <div className="flex flex-col">
              <span className="font-medium">Print</span>
              <span className="text-xs text-muted-foreground">Open in new tab with print dialog</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEmail} className="gap-2 cursor-pointer">
            <Mail className="h-4 w-4 text-amber-600" />
            <div className="flex flex-col">
              <span className="font-medium">Email report</span>
              <span className="text-xs text-muted-foreground">Downloads PDF + opens mail draft</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
