// Verifies that when a user is denied an action, the error message tells them
// exactly which role(s) can do it. This is the "alert" the user sees as a toast.

import {
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  getRolesWithPermission,
  hasPermission,
  type Role,
  type Permission,
} from "../lib/rbac";

function buildMessage(perm: Permission, actingAs: Role): string {
  const allowed = getRolesWithPermission(perm);
  if (allowed.length === 0) {
    return "This action is restricted and cannot be performed by any role.";
  }
  const names = allowed.map((r) => ROLE_LABELS[r]);
  const list =
    names.length === 1
      ? names[0]
      : names.length === 2
      ? `${names[0]} or ${names[1]}`
      : `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
  return `This action can only be performed by ${list}. You are signed in as ${ROLE_LABELS[actingAs]}.`;
}

const CASES: Array<{
  actingAs: Role;
  perm: Permission;
  expectedRoleInMessage: string;
  expectedActingRoleInMessage: string;
  expectedAllowed: Role[];
}> = [
  // Admin trying to create an RFQ (procurement action)
  {
    actingAs: "admin",
    perm: "rfq:create",
    expectedRoleInMessage: "Procurement Officer",
    expectedActingRoleInMessage: "Admin",
    expectedAllowed: ["procurement_officer"],
  },
  // Admin trying to approve a quotation
  {
    actingAs: "admin",
    perm: "quotation:approve",
    expectedRoleInMessage: "Manager / Approver",
    expectedActingRoleInMessage: "Admin",
    expectedAllowed: ["manager"],
  },
  // Admin trying to create a PO
  {
    actingAs: "admin",
    perm: "po:create",
    expectedRoleInMessage: "Procurement Officer",
    expectedActingRoleInMessage: "Admin",
    expectedAllowed: ["procurement_officer"],
  },
  // Procurement officer trying to mark an invoice paid
  {
    actingAs: "procurement_officer",
    perm: "invoice:mark_paid",
    expectedRoleInMessage: "Manager / Approver",
    expectedActingRoleInMessage: "Procurement Officer",
    expectedAllowed: ["manager"],
  },
  // Vendor trying to create a vendor record
  {
    actingAs: "vendor",
    perm: "vendor:create",
    expectedRoleInMessage: "Admin or Procurement Officer",
    expectedActingRoleInMessage: "Vendor",
    expectedAllowed: ["admin", "procurement_officer"],
  },
  // Manager trying to manage users
  {
    actingAs: "manager",
    perm: "user:manage",
    expectedRoleInMessage: "Admin",
    expectedActingRoleInMessage: "Manager / Approver",
    expectedAllowed: ["admin"],
  },
];

let pass = 0;
let fail = 0;

console.log("=== Permission Alert Message Test ===\n");
console.log("Verifies: when a user is denied an action, the error toast tells them which role can do it.\n");

for (const c of CASES) {
  const allowed = getRolesWithPermission(c.perm);
  const message = buildMessage(c.perm, c.actingAs);

  // 1. The acting user actually doesn't have the permission
  const denied = !hasPermission(c.actingAs, c.perm);
  // 2. The expected allowed roles match
  const allowedMatch =
    allowed.length === c.expectedAllowed.length &&
    allowed.every((r) => c.expectedAllowed.includes(r));
  // 3. The message mentions the right role(s) that CAN do it
  const mentionsAllowed = message.includes(c.expectedRoleInMessage);
  // 4. The message mentions the acting role
  const mentionsActing = message.includes(c.expectedActingRoleInMessage);
  // 5. The message uses the "only be performed by" prefix
  const hasPrefix = message.startsWith("This action can only be performed by");

  const ok = denied && allowedMatch && mentionsAllowed && mentionsActing && hasPrefix;
  if (ok) pass++;
  else fail++;

  console.log(`  ${ok ? "PASS" : "FAIL"} ${c.actingAs} denied "${c.perm}"`);
  console.log(`        message: ${message}`);
  if (!ok) {
    if (!denied) console.log(`        - acting role unexpectedly has the permission`);
    if (!allowedMatch) console.log(`        - allowed roles mismatch: got ${allowed}, want ${c.expectedAllowed}`);
    if (!mentionsAllowed) console.log(`        - message missing allowed role: ${c.expectedRoleInMessage}`);
    if (!mentionsActing) console.log(`        - message missing acting role: ${c.expectedActingRoleInMessage}`);
    if (!hasPrefix) console.log(`        - message missing expected prefix`);
  }
}

// Also sanity check: every role's permissions match ROLE_PERMISSIONS
console.log(`\nSanity check: getRolesWithPermission agrees with ROLE_PERMISSIONS`);
for (const role of ["admin", "manager", "procurement_officer", "vendor"] as Role[]) {
  for (const perm of ROLE_PERMISSIONS[role]) {
    const allowed = getRolesWithPermission(perm);
    if (!allowed.includes(role)) {
      console.log(`  FAIL: role ${role} has perm ${perm} but getRolesWithPermission doesn't list it`);
      fail++;
    } else {
      pass++;
    }
  }
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
console.log("=== All alert messages include which role can do the action ===");
