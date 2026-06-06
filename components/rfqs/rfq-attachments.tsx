"use client";

import { useState, useTransition, useRef } from "react";
import { FileText, Image as ImageIcon, Upload, X, FileSpreadsheet, FileType, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { uploadRfqAttachment, deleteRfqAttachment } from "@/lib/actions";
import { toast } from "sonner";

type Attachment = {
  id: number;
  filename: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date | number;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.includes("sheet") || mime.includes("excel")) return FileSpreadsheet;
  if (mime.includes("pdf") || mime.includes("word") || mime.includes("text")) return FileText;
  return FileType;
}

export function RfqAttachments({ rfqId, initialAttachments }: { rfqId: number; initialAttachments: Attachment[] }) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadRfqAttachment(rfqId, fd);
        if (!res.success) {
          toast.error(`Failed to upload ${file.name}`, { description: res.error });
        } else {
          toast.success(`Uploaded ${file.name}`);
        }
      }
      // Refresh by reloading page (server component re-fetches)
      window.location.reload();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: number, filename: string) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    startTransition(async () => {
      const res = await deleteRfqAttachment(id);
      if (res.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
        toast.success(`Deleted ${filename}`);
      } else {
        toast.error("Delete failed", { description: res.error });
      }
    });
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
        }}
        className={`rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) handleUpload(e.target.files);
          }}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
        />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {uploading ? "Uploading…" : "Drag & drop files or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF, images, Word, Excel, CSV (max 10MB each)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose files
          </Button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {attachments.map((a) => {
            const Icon = fileIcon(a.mimeType);
            return (
              <Card key={a.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={a.filename}>
                      {a.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(a.fileSize)} • {a.mimeType.split("/")[1]?.toUpperCase() ?? "FILE"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`/uploads/rfq/${a.storedName}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id, a.filename)}
                      disabled={pending}
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
