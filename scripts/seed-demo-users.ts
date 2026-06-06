// Seed one demo user per role using better-auth's signUp API
// (so passwords are hashed with the correct format)
// Then deterministically reset every demo password to PASSWORD so the
// seeder is fully idempotent — re-running fixes any stale hashes too.

import { db } from "../lib/db";
import { user, account } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

const BASE = "http://localhost:3000";

const DEMO_USERS = [
  { email: "admin@vendorbridge.io", name: "Demo Admin", role: "admin" },
  { email: "manager@vendorbridge.io", name: "Demo Manager", role: "manager" },
  { email: "officer@vendorbridge.io", name: "Demo Officer", role: "procurement_officer" },
  { email: "vendor@vendorbridge.io", name: "Demo Vendor", role: "vendor" },
];

const PASSWORD = "demo1234";

async function main() {
  console.log("=== Seeding Demo Users via better-auth ===\n");

  for (const u of DEMO_USERS) {
    const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: u.email,
        password: PASSWORD,
        name: u.name,
      }),
    });

    if (res.ok) {
      console.log(`  CREATED: ${u.email}`);
    } else {
      const data = await res.json().catch(() => ({}));
      const msg = data?.message || data?.error || res.statusText;
      if (msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("already")) {
        console.log(`  EXISTS:  ${u.email}`);
      } else {
        console.log(`  FAIL:    ${u.email} - ${msg}`);
      }
    }
  }

  console.log(`\n=== Promoting roles in DB ===`);
  for (const u of DEMO_USERS) {
    await db.update(user).set({ role: u.role as any }).where(eq(user.email, u.email));
    console.log(`  ${u.email} -> ${u.role}`);
  }

  console.log(`\n=== Resetting demo passwords to "${PASSWORD}" ===`);
  const newHash = await hashPassword(PASSWORD);
  for (const u of DEMO_USERS) {
    const [uRow] = await db.select({ id: user.id }).from(user).where(eq(user.email, u.email));
    if (!uRow) continue;
    await db
      .update(account)
      .set({ password: newHash, updatedAt: new Date() })
      .where(eq(account.userId, uRow.id));
    console.log(`  ${u.email} -> password reset`);
  }

  const all = await db.select({ email: user.email, role: user.role }).from(user);
  console.log(`\n=== Current demo users ===`);
  for (const u of all.filter((x: { email: string }) => x.email.endsWith("@vendorbridge.io"))) {
    console.log(`  ${u.email.padEnd(35)} ${u.role}`);
  }
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
