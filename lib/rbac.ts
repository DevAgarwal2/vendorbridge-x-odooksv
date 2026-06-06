import { getSession } from "@/lib/session";

export type Role = "procurement_officer" | "manager" | "finance" | "admin" | "vendor";

export const ROLE_LABELS: Record<Role, string> = {
  procurement_officer: "Procurement Officer",
  manager: "Manager / Approver",
  finance: "Finance",
  admin: "Admin",
  vendor: "Vendor",
};

export type Permission =
  | "vendor:create"
  | "vendor:update"
  | "vendor:delete"
  | "rfq:create"
  | "rfq:send"
  | "rfq:delete"
  | "quotation:create"
  | "quotation:approve"
  | "quotation:reject"
  | "po:create"
  | "po:view"
  | "invoice:view"
  | "invoice:mark_paid"
  | "report:view"
  | "activity:view"
  | "user:manage"
  | "approvals:view";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Admin: spec says "Manage users, Manage vendors, View procurement analytics" only.
  // Admin does NOT approve, generate POs, or create RFQs — that is the procurement officer's job.
  admin: [
    "vendor:create", "vendor:update", "vendor:delete",
    "user:manage",
    "report:view",
  ],
  // Manager / Approver: spec says "Approve or reject procurement requests, Monitor procurement workflows".
  manager: [
    "quotation:approve", "quotation:reject",
    "approvals:view",
    "activity:view",
    "report:view",
  ],
  // Procurement Officer: spec says "Create RFQs, Compare quotations, Generate POs, Generate invoices".
  procurement_officer: [
    "vendor:create", "vendor:update",
    "rfq:create", "rfq:send",
    "quotation:create",
    "po:create", "po:view",
    "invoice:view",
    "report:view", "activity:view", "approvals:view",
  ],
  // Finance (extended role): manages invoices & payments.
  finance: [
    "invoice:view", "invoice:mark_paid",
    "po:view",
    "report:view", "activity:view", "approvals:view",
  ],
  // Vendor: spec says "Submit quotations, Track RFQ status, View POs".
  vendor: [
    "quotation:create",
    "po:view",
    "activity:view",
  ],
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) {
    throw new AuthError("Not authenticated", 401);
  }
  const u = session.user as any;
  const role = (u.role || "procurement_officer") as Role;
  return {
    id: u.id,
    email: u.email,
    name: u.name || u.email,
    role,
  };
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  const allowed = ROLE_PERMISSIONS[user.role] || [];
  if (!allowed.includes(permission)) {
    throw new AuthError(`Role "${ROLE_LABELS[user.role]}" cannot perform this action`, 403);
  }
  return user;
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

export function canViewNavItem(role: Role, href: string): boolean {
  const map: Record<string, Permission> = {
    "/": "report:view",
    "/vendors": "vendor:create",
    // RFQs: vendors can track status of their assigned RFQs (filtered server-side).
    "/rfqs": role === "vendor" ? "activity:view" : "rfq:create",
    "/quotations": "quotation:create",
    "/approvals": "approvals:view",
    "/purchase-orders": "po:view",
    "/invoices": "invoice:view",
    "/reports": "report:view",
    "/activity": "activity:view",
  };
  const perm = map[href];
  if (!perm) return true;
  return hasPermission(role, perm);
}
