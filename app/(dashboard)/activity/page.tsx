import { getActivityLogs } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, FileText, CheckCircle, Receipt, Truck, MessageSquareQuote } from "lucide-react";
import { format } from "date-fns";

const iconMap: Record<string, React.ReactNode> = {
  rfq: <FileText className="h-4 w-4" />,
  quotation: <MessageSquareQuote className="h-4 w-4" />,
  approval: <CheckCircle className="h-4 w-4" />,
  po: <FileText className="h-4 w-4" />,
  invoice: <Receipt className="h-4 w-4" />,
  vendor: <Truck className="h-4 w-4" />,
};

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Activity & Logs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Procurement audit trail.
        </p>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {iconMap[log.type] || <Activity className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{log.title}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {log.createdAt ? format(new Date(log.createdAt), "dd MMM yyyy, h:mm a") : "—"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{log.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {logs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No activity recorded.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Audit logs are immutable. Entries cannot be edited or deleted.
      </p>
    </div>
  );
}
