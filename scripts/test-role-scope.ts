import { ROLE_PERMISSIONS, ROLE_LABELS, type Role, type Permission } from "../lib/rbac";

const ALL_ROLES: Role[] = ["admin", "manager", "procurement_officer", "finance", "vendor"];

function getPerms(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

const SPEC: Record<Role, { can: Permission[]; cannot: Permission[]; description: string }> = {
  admin: {
    description: "Manage users, manage vendors, view analytics",
    can: ["vendor:create", "vendor:update", "vendor:delete", "user:manage", "report:view"],
    cannot: [
      "rfq:create", "rfq:send", "rfq:delete",
      "quotation:create", "quotation:approve", "quotation:reject",
      "po:create",
      "invoice:mark_paid",
      "approvals:view", "activity:view",
    ],
  },
  manager: {
    description: "Approve or reject procurement requests, monitor workflows",
    can: ["quotation:approve", "quotation:reject", "approvals:view", "activity:view", "report:view"],
    cannot: [
      "vendor:create", "vendor:update", "vendor:delete",
      "rfq:create", "rfq:send", "rfq:delete",
      "quotation:create",
      "po:create",
      "invoice:mark_paid",
      "user:manage",
    ],
  },
  procurement_officer: {
    description: "Create RFQs, compare quotations, generate POs, generate invoices",
    can: [
      "vendor:create", "vendor:update",
      "rfq:create", "rfq:send",
      "quotation:create",
      "po:create", "po:view",
      "invoice:view",
      "report:view", "activity:view", "approvals:view",
    ],
    cannot: [
      "vendor:delete", "rfq:delete",
      "quotation:approve", "quotation:reject",
      "invoice:mark_paid",
      "user:manage",
    ],
  },
  finance: {
    description: "Manages invoices & payments (extended role)",
    can: [
      "invoice:view", "invoice:mark_paid",
      "po:view",
      "report:view", "activity:view", "approvals:view",
    ],
    cannot: [
      "vendor:create", "vendor:update", "vendor:delete",
      "rfq:create", "rfq:send", "rfq:delete",
      "quotation:create", "quotation:approve", "quotation:reject",
      "po:create",
      "user:manage",
    ],
  },
  vendor: {
    description: "Submit quotations, track RFQ status, view POs",
    can: ["quotation:create", "po:view", "activity:view"],
    cannot: [
      "vendor:create", "vendor:update", "vendor:delete",
      "rfq:create", "rfq:send", "rfq:delete",
      "quotation:approve", "quotation:reject",
      "po:create",
      "invoice:view", "invoice:mark_paid",
      "report:view", "approvals:view",
      "user:manage",
    ],
  },
};

function main() {
  console.log("=== Role Scope Audit ===\n");
  console.log("Spec: Each role must have exactly the permissions in the problem statement.\n");

  let allPassed = true;
  for (const role of ALL_ROLES) {
    const perms = getPerms(role);
    const expected = SPEC[role];

    console.log(`--- ${ROLE_LABELS[role]} (${role}) ---`);
    console.log(`  Description: ${expected.description}`);

    // Check required permissions are granted
    for (const p of expected.can) {
      if (!perms.includes(p)) {
        console.log(`  ✗ MISSING required permission: ${p}`);
        allPassed = false;
      }
    }
    // Check out-of-scope permissions are denied
    for (const p of expected.cannot) {
      if (perms.includes(p)) {
        console.log(`  ✗ HAS out-of-scope permission: ${p}`);
        allPassed = false;
      }
    }
    // Check no surprise permissions (not in can or cannot)
    const allowed = new Set([...expected.can, ...expected.cannot]);
    for (const p of perms) {
      if (!allowed.has(p)) {
        console.log(`  ? Has additional permission not in spec: ${p}`);
      }
    }

    console.log(`  Permissions: ${perms.join(", ")}`);
    console.log(`  ✓ Matches spec\n`);
  }

  if (!allPassed) {
    console.log("✗ Audit FAILED");
    process.exit(1);
  }
  console.log("=== All roles match the spec ===");
}

main();
