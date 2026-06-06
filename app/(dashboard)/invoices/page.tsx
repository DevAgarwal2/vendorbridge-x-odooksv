import Link from "next/link";
import { getInvoices } from "@/lib/actions";
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

export default async function InvoicesPage() {
  const invoicesList = await getInvoices();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track invoices and payments.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Invoice #</TableHead>
                <TableHead className="text-xs">PO #</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Grand Total</TableHead>
                <TableHead className="text-xs">Due Date</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesList.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm font-medium font-mono">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">PO-{inv.poId}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        inv.status === "paid"
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : inv.status === "pending_payment"
                          ? "border-amber-200 text-amber-700 bg-amber-50"
                          : "border-slate-200 text-slate-700 bg-slate-50"
                      }`}
                    >
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium">₹{inv.grandTotal?.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.dueDate ? format(new Date(inv.dueDate), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/invoices/${inv.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {invoicesList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No invoices yet.
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
