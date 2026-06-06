"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, KeyRound, Mail, CheckCircle2, Loader2, Lock, Eye, EyeOff, AlertCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordInApp } from "@/lib/actions";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (newPw.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("email", email);
        fd.append("newPassword", newPw);
        fd.append("confirmPassword", confirm);
        const res = await resetPasswordInApp(fd);
        if (!res.success) {
          setError(res.error);
          return;
        }
        setDone(true);
        toast.success("Password reset", {
          description: "You can now sign in with your new password.",
        });
        setTimeout(() => router.push("/login"), 2500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    });
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <KeyRound className="h-3.5 w-3.5" />
              </div>
              VendorBridge
            </div>
          </div>
          <Card className="border-border/60 shadow-lg">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-900">Password reset successfully</p>
                  <p className="text-emerald-700 text-xs mt-0.5">Redirecting you to login…</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" type="button" onClick={() => router.push("/login")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <KeyRound className="h-3.5 w-3.5" />
            </div>
            VendorBridge
          </div>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="font-heading text-2xl">Reset password</CardTitle>
            <CardDescription>
              Enter your email and choose a new password. No email link required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-900">
              <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p>
                This is an internal tool. Anyone with access to this page can reset a password by knowing the email. In production, this flow would use an emailed token.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs uppercase tracking-wider text-muted-foreground">
                  New password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="pl-9 pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Confirm new password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-9"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {newPw && newPw.length < 8 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Password must be at least 8 characters
                </p>
              )}
              {confirm && newPw !== confirm && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting password…
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>

              <Button variant="ghost" className="w-full" type="button" onClick={() => router.push("/login")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Password must be at least 8 characters.
        </p>
      </div>
    </div>
  );
}
