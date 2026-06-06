// Server-only RBAC helpers. Imports `next/headers` via `lib/session`.
// Do NOT import this from a client component.

import "server-only";
import { getSession } from "@/lib/session";
import {
  hasPermission,
  getRolesWithPermission,
  formatRoleList,
  ROLE_LABELS,
  type Role,
  type Permission,
  type SessionUser,
} from "@/lib/rbac";

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
    const allowedRoles = getRolesWithPermission(permission);
    const message = allowedRoles.length === 0
      ? `This action is restricted and cannot be performed by any role.`
      : `This action can only be performed by ${formatRoleList(allowedRoles)}. You are signed in as ${ROLE_LABELS[user.role]}.`;
    throw new AuthError(message, 403);
  }
  return user;
}

// re-export ROLE_PERMISSIONS for server-side code that wants the table
import { ROLE_PERMISSIONS } from "@/lib/rbac";
export { ROLE_PERMISSIONS, hasPermission };
