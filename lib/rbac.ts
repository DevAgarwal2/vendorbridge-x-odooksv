// Pure RBAC module: types, role definitions, and side-effect-free helpers.
// Safe to import from client components.

export type Role = "procurement_officer" | "manager" | "admin" | "vendor";

export const ROLE_LABELS: Record<Role, string> = {
  procurement_officer: "Procurement Officer",
  manager: "Manager / Approver",
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
  // Also handles invoice payment as part of monitoring the procurement workflow end-to-end.
  manager: [
    "quotation:approve", "quotation:reject",
    "approvals:view",
    "invoice:view", "invoice:mark_paid",
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

export function hasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

export function getRolesWithPermission(permission: Permission): Role[] {
  return (Object.keys(ROLE_PERMISSIONS) as Role[]).filter((r) =>
    ROLE_PERMISSIONS[r].includes(permission)
  );
}

export function formatRoleList(roles: Role[]): string {
  if (roles.length === 0) return "no role";
  const names = roles.map((r) => ROLE_LABELS[r]);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
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
