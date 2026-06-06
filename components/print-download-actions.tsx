"use client";

import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";
import { useState } from "react";

type Props = {
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
  downloadLabel?: string;
  printLabel?: string;
  emailLabel?: string;
  size?: "sm" | "default" | "lg";
  showEmail?: boolean;
};

export function PrintDownloadActions({
  onPrint,
  onDownload,
  onEmail,
  downloadLabel = "PDF",
  printLabel = "Print",
  emailLabel = "Email",
  size = "sm",
  showEmail = false,
}: Props) {
  const [busy, setBusy] = useState<"print" | "download" | "email" | null>(null);

  async function handle(action: "print" | "download" | "email", fn?: () => void | Promise<void>) {
    if (!fn) return;
    setBusy(action);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="no-print flex items-center gap-2">
      {onDownload && (
        <Button
          variant="outline"
          size={size}
          onClick={() => handle("download", onDownload)}
          disabled={busy !== null}
        >
          {busy === "download" ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1.5" />
          )}
          {downloadLabel}
        </Button>
      )}
      {onPrint && (
        <Button
          variant="outline"
          size={size}
          onClick={() => handle("print", onPrint)}
          disabled={busy !== null}
        >
          {busy === "print" ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Printer className="h-4 w-4 mr-1.5" />
          )}
          {printLabel}
        </Button>
      )}
      {showEmail && onEmail && (
        <Button
          variant="outline"
          size={size}
          onClick={() => handle("email", onEmail)}
          disabled={busy !== null}
        >
          {busy === "email" ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Mail className="h-4 w-4 mr-1.5" />
          )}
          {emailLabel}
        </Button>
      )}
    </div>
  );
}

function Mail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
