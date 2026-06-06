"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Truck,
  FileText,
  MessageSquareQuote,
  CheckCircle,
  ShoppingCart,
  Receipt,
  BarChart3,
  Activity,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Vendors", href: "/vendors", icon: Truck },
  { label: "RFQ's", href: "/rfqs", icon: FileText },
  { label: "Quotations", href: "/quotations", icon: MessageSquareQuote },
  { label: "Approvals", href: "/approvals", icon: CheckCircle },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Activity", href: "/activity", icon: Activity },
];

export function Sidebar({ role = "procurement_officer" }: { role?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-sidebar h-screen sticky top-0 transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-3 h-16 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-heading font-bold text-sm">
          VB
        </div>
        {!collapsed && (
          <span className="font-heading font-semibold text-lg tracking-tight text-sidebar-foreground">
            VendorBridge
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="shrink-0 border-t border-sidebar-border p-3 space-y-1.5">
          <div className="px-2.5 pb-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signed in as</p>
            <p className="text-xs font-medium text-sidebar-foreground capitalize mt-0.5">
              {role.replace(/_/g, " ")}
            </p>
          </div>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors w-full",
              pathname === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}

      <div className="shrink-0 border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4 mr-2" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
