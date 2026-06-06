import { getPendingApprovals } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { approveQuotation, rejectQuotation, createPurchaseOrderFromQuotation } from "@/lib/actions";
import { CheckCircle, XCircle } from "lucide-react";

export default async function ApprovalsPage() {
  const pending = await getPendingApprovals();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Approvals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and approve procurement requests.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">RFQ</TableHead>
                <TableHead className="text-xs">Vendor</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Delivery</TableHead>
                <TableHead className="text-xs">Terms</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="text-sm font-medium">{q.rfqTitle}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.vendorName}</TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    ₹{q.grandTotal?.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.deliveryDays} days</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{q.paymentTerms}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await approveQuotation(q.id);
                          await createPurchaseOrderFromQuotation(q.id);
                        }}
                      >
                        <Button type="submit" size="sm" variant="default">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await rejectQuotation(q.id);
                        }}
                      >
                        <Button type="submit" size="sm" variant="outline">
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pending.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No pending approvals.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
