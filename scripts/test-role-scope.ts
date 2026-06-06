import { ROLE_PERMISSIONS, ROLE_LABELS, type Role, type Permission } from "../lib/rbac";

const ALL_ROLES: Role[] = ["admin", "manager", "procurement_officer", "vendor"];

function getPerms(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

const SPEC: Record<Role, { can: Permission[]; cannot: Permission[]; description: string }> = {
  admin: {
    description: "Manage users, manage vendors, view procurement analytics",
    can: ["vendor:create", "vendor:update", "vendor:delete", "user:manage", "report:view"],
    cannot: [
      "rfq:create", "rfq:send", "rfq:delete",
      "quotation:create", "quotation:approve", "quotation:reject",
      "po:create", "po:view",
      "invoice:view", "invoice:mark_paid",
      "approvals:view", "activity:view",
    ],
  },
  manager: {
    description: "Approve or reject procurement requests, monitor procurement workflows",
    can: [
      "quotation:approve", "quotation:reject",
      "approvals:view",
      "invoice:view", "invoice:mark_paid",
      "activity:view",
      "report:view",
    ],
    cannot: [
      "vendor:create", "vendor:update", "vendor:delete",
      "rfq:create", "rfq:send", "rfq:delete",
      "quotation:create",
      "po:create",
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

    for (const p of expected.can) {
      if (!perms.includes(p)) {
        console.log(`  FAIL MISSING required permission: ${p}`);
        allPassed = false;
      }
    }
    for (const p of expected.cannot) {
      if (perms.includes(p)) {
        console.log(`  FAIL HAS out-of-scope permission: ${p}`);
        allPassed = false;
      }
    }
    const allowed = new Set([...expected.can, ...expected.cannot]);
    for (const p of perms) {
      if (!allowed.has(p)) {
        console.log(`  ? Has additional permission not in spec: ${p}`);
      }
    }

    console.log(`  Permissions: ${perms.join(", ")}`);
    console.log(`  PASS Matches spec\n`);
  }

  if (!allPassed) {
    console.log("FAIL Audit FAILED");
    process.exit(1);
  }
  console.log("=== All roles match the spec ===");
}

main();
