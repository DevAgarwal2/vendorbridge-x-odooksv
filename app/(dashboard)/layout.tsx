import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { Role } from "@/lib/rbac";

const VALID_ROLES: Role[] = ["procurement_officer", "manager", "finance", "admin", "vendor"];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const rawRole = (session.user as any).role || "procurement_officer";
  const role: Role = VALID_ROLES.includes(rawRole) ? rawRole : "procurement_officer";

  const user = {
    name: session.user.name || session.user.email,
    email: session.user.email,
    role,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
