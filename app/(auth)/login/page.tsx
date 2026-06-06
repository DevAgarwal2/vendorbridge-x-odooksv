"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Shield, Briefcase, Truck, Store, ArrowRight } from "lucide-react";

type DemoUser = {
  email: string;
  role: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "admin@vendorbridge.io",
    role: "admin",
    label: "Admin",
    icon: Shield,
    description: "Full access to everything",
    color: "text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200",
  },
  {
    email: "manager@vendorbridge.io",
    role: "manager",
    label: "Manager",
    icon: Briefcase,
    description: "Approves quotations, manages vendors",
    color: "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    email: "officer@vendorbridge.io",
    role: "procurement_officer",
    label: "Procurement Officer",
    icon: Truck,
    description: "Creates RFQs, vendors, POs",
    color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
  },
  {
    email: "vendor@vendorbridge.io",
    role: "vendor",
    label: "Vendor",
    icon: Store,
    description: "Submits quotations on RFQs",
    color: "text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function signIn(emailVal: string, passwordVal: string): Promise<boolean> {
    const res = await authClient.signIn.email({
      email: emailVal,
      password: passwordVal,
      callbackURL: "/",
    });
    return !res.error;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await signIn(email, password);
    if (ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Invalid email or password");
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoEmail: string) {
    setError("");
    setDemoLoading(demoEmail);
    const ok = await signIn(demoEmail, "demo1234");
    if (ok) {
      toast.success(`Signed in as ${demoEmail}`);
      router.push("/");
      router.refresh();
    } else {
      toast.error("Demo login failed. Run: bun run scripts/seed-demo-users.ts");
      setDemoLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-heading font-bold">
          VB
        </div>
        <CardTitle className="font-heading text-2xl">Sign in to VendorBridge</CardTitle>
        <CardDescription>Enter your credentials or pick a demo role below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="officer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading || demoLoading !== null}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or sign in as demo</span>
          </div>
        </div>

        <div className="grid gap-2">
          {DEMO_USERS.map((u) => {
            const Icon = u.icon;
            const isLoading = demoLoading === u.email;
            return (
              <button
                key={u.email}
                type="button"
                onClick={() => handleDemoLogin(u.email)}
                disabled={loading || demoLoading !== null}
                className={`group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${u.color} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/70 shrink-0">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{u.label}</p>
                  <p className="text-xs opacity-75 truncate">{u.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Demo password: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">demo1234</code>
        </p>
      </CardContent>
    </Card>
  );
}
