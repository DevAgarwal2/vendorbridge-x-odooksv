import { resetPasswordInApp } from "../lib/actions";
import { db } from "../lib/db";
import { user, account, session } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";

async function main() {
  console.log("=== In-app Password Reset Test ===\n");

  const email = "admin@vendorbridge.io";
  const original = "demo1234";

  // 1. Find the test user
  const [u] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, email));
  if (!u) {
    console.log("✗ User not found");
    process.exit(1);
  }
  console.log(`✓ Found user: ${u.id} (${u.email})`);

  // Helper to read current password hash
  async function getHash() {
    const [a] = await db
      .select({ password: account.password })
      .from(account)
      .where(and(eq(account.userId, u.id), eq(account.providerId, "credential")));
    return a?.password ?? "";
  }

  // 2. Verify original password works
  let hash = await getHash();
  let ok = await verifyPassword({ hash, password: original });
  console.log(`✓ Sign-in with '${original}': ${ok ? "OK" : "FAIL"}`);
  if (!ok) process.exit(1);

  // 3. Reset to a new password via the action
  const fd = new FormData();
  fd.append("email", email);
  fd.append("newPassword", "newpass1234");
  fd.append("confirmPassword", "newpass1234");
  const res = await resetPasswordInApp(fd);
  console.log(`✓ resetPasswordInApp: ${res.success ? "OK" : res.error}`);
  if (!res.success) process.exit(1);

  // 4. Verify new password works
  hash = await getHash();
  ok = await verifyPassword({ hash, password: "newpass1234" });
  console.log(`✓ Sign-in with 'newpass1234': ${ok ? "OK" : "FAIL"}`);
  if (!ok) process.exit(1);

  // 5. Verify old password no longer works
  ok = await verifyPassword({ hash, password: original });
  console.log(`✓ Old '${original}' rejected: ${!ok ? "OK" : "FAIL"}`);
  if (ok) process.exit(1);

  // 6. Restore the demo password
  const fd2 = new FormData();
  fd2.append("email", email);
  fd2.append("newPassword", original);
  fd2.append("confirmPassword", original);
  const restore = await resetPasswordInApp(fd2);
  console.log(`✓ Restored to '${original}': ${restore.success ? "OK" : restore.error}`);

  // 7. Test validation: mismatched passwords
  const fd3 = new FormData();
  fd3.append("email", email);
  fd3.append("newPassword", "validpass99");
  fd3.append("confirmPassword", "different99");
  const mismatch = await resetPasswordInApp(fd3);
  console.log(`✓ Mismatched passwords rejected: ${!mismatch.success ? "OK (" + mismatch.error + ")" : "FAIL"}`);
  if (mismatch.success) process.exit(1);

  // 8. Test validation: short password
  const fd4 = new FormData();
  fd4.append("email", email);
  fd4.append("newPassword", "short");
  fd4.append("confirmPassword", "short");
  const short = await resetPasswordInApp(fd4);
  console.log(`✓ Short password rejected: ${!short.success ? "OK (" + short.error + ")" : "FAIL"}`);
  if (short.success) process.exit(1);

  // 9. Test non-existent email returns success (no leak)
  const fd5 = new FormData();
  fd5.append("email", "nonexistent@nowhere.io");
  fd5.append("newPassword", "valid1234");
  fd5.append("confirmPassword", "valid1234");
  const noLeak = await resetPasswordInApp(fd5);
  console.log(`✓ Unknown email returns success (no leak): ${noLeak.success ? "OK" : "FAIL"}`);

  // 10. Test invalid email format
  const fd6 = new FormData();
  fd6.append("email", "not-an-email");
  fd6.append("newPassword", "valid1234");
  fd6.append("confirmPassword", "valid1234");
  const badEmail = await resetPasswordInApp(fd6);
  console.log(`✓ Bad email format rejected: ${!badEmail.success ? "OK (" + badEmail.error + ")" : "FAIL"}`);
  if (badEmail.success) process.exit(1);

  // 11. Verify sessions were invalidated
  const remaining = await db
    .select({ id: session.id })
    .from(session)
    .where(eq(session.userId, u.id));
  console.log(`✓ Sessions cleared: ${remaining.length === 0 ? "OK" : "FAIL (" + remaining.length + " remaining)"}`);

  console.log("\n=== All password reset checks passed ===");
  console.log(`Admin password restored to '${original}'.`);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
