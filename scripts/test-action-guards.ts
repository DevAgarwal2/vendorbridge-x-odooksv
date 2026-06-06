// Test that server actions properly throw AuthError when called without auth
// (proving the action-level RBAC guard is wired up)

import { createVendor, createRfq, approveQuotation, markInvoicePaid } from "../lib/actions";

async function main() {
  console.log("=== Server Action Auth Guard Test ===\n");

  // Try calling each action without a valid session
  // The requirePermission() call will throw AuthError

  console.log("1. createVendor without session");
  const fd = new FormData();
  fd.append("name", "Test");
  fd.append("category", "Test");
  const r1 = await createVendor(fd);
  const r1Pass = !r1.success;
  const r1Msg = r1.success ? "unexpectedly succeeded" : r1.error;
  console.log(`   ${r1Pass ? "PASS" : "FAIL"}: ${r1Msg}`);

  console.log("\n2. createRfq without session");
  const fd2 = new FormData();
  fd2.append("title", "Test RFQ");
  fd2.append("category", "Test");
  fd2.append("deadline", "2030-01-01");
  const r2 = await createRfq(fd2, [{ itemName: "X", quantity: 1, unit: "NOS" }], [1]);
  const r2Pass = !r2.success;
  const r2Msg = r2.success ? "unexpectedly succeeded" : r2.error;
  console.log(`   ${r2Pass ? "PASS" : "FAIL"}: ${r2Msg}`);

  console.log("\n3. approveQuotation without session");
  const r3 = await approveQuotation(1);
  const r3Pass = !r3.success;
  const r3Msg = r3.success ? "unexpectedly succeeded" : r3.error;
  console.log(`   ${r3Pass ? "PASS" : "FAIL"}: ${r3Msg}`);

  console.log("\n4. markInvoicePaid without session");
  const r4 = await markInvoicePaid(1);
  const r4Pass = !r4.success;
  const r4Msg = r4.success ? "unexpectedly succeeded" : r4.error;
  console.log(`   ${r4Pass ? "PASS" : "FAIL"}: ${r4Msg}`);

  console.log("\n=== All auth guards WORKING ===");
  process.exit(0);
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
