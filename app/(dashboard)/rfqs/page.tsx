import Link from "next/link";
import { getRfqs } from "@/lib/actions";
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
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";

export default async function RfqsPage() {
  const rfqsList = await getRfqs();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            RFQs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage request for quotations.
          </p>
        </div>
        <Link href="/rfqs/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            New RFQ
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Deadline</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqsList.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">{r.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.deadline ? format(new Date(r.deadline), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        r.status === "sent"
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : r.status === "draft"
                          ? "border-slate-200 text-slate-700 bg-slate-50"
                          : "border-sky-200 text-sky-700 bg-sky-50"
                      }`}
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/rfqs/${r.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rfqsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    No RFQs yet.
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
