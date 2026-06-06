import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and password.
        </p>
      </div>
      <SettingsForm
        user={{
          name: session.user.name,
          email: session.user.email,
          role: (session.user as any).role ?? "procurement_officer",
        }}
      />
    </div>
  );
}
