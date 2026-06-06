"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  approveQuotation,
  rejectQuotation,
  createPurchaseOrderFromQuotation,
} from "@/lib/actions";
import { hasPermission, type Role } from "@/lib/rbac";

type Props = {
  role: Role;
  quotationId: number;
  status: string;
};

export function QuotationActions({ role, quotationId, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const canApprove = hasPermission(role, "quotation:approve");
  const canCreatePO = hasPermission(role, "po:create");

  function run(fn: () => Promise<{ success: boolean; error?: string }>, successMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(res.error || "Action failed");
      }
    });
  }

  if (status === "submitted" && canApprove) {
    return (
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="default"
          disabled={pending}
          onClick={() => run(() => approveQuotation(quotationId), "Quotation approved")}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => rejectQuotation(quotationId), "Quotation rejected")}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
          Reject
        </Button>
      </div>
    );
  }

  if (status === "approved" && canCreatePO) {
    return (
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            run(() => createPurchaseOrderFromQuotation(quotationId), "Purchase order created")
          }
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <FileText className="h-3.5 w-3.5 mr-1" />}
          Generate PO
        </Button>
      </div>
    );
  }

  if (status === "approved" && !canCreatePO) {
    return (
      <span className="text-xs text-muted-foreground italic">Approved — awaiting PO</span>
    );
  }

  if (status === "rejected") {
    return <span className="text-xs text-muted-foreground italic">Rejected</span>;
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}
