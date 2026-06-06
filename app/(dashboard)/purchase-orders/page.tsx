import Link from "next/link";
import { getPurchaseOrders } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { format } from "date-fns";

export default async function PurchaseOrdersPage() {
  const pos = await getPurchaseOrders();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage purchase orders.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">PO Number</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Subtotal</TableHead>
                <TableHead className="text-xs text-right">CGST</TableHead>
                <TableHead className="text-xs text-right">SGST</TableHead>
                <TableHead className="text-xs text-right">Grand Total</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="text-sm font-medium font-mono">{po.poNumber}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        po.status === "paid"
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : po.status === "pending_payment"
                          ? "border-amber-200 text-amber-700 bg-amber-50"
                          : po.status === "approved"
                          ? "border-sky-200 text-sky-700 bg-sky-50"
                          : "border-slate-200 text-slate-700 bg-slate-50"
                      }`}
                    >
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-right">₹{po.subtotal?.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-sm text-right">₹{po.cgst?.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-sm text-right">₹{po.sgst?.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-sm text-right font-medium">₹{po.grandTotal?.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {po.dueDate ? format(new Date(po.dueDate), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/purchase-orders/${po.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {pos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    No purchase orders yet.
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
