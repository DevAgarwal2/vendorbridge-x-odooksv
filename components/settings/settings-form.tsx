"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle, Mail } from "lucide-react";
import { toast } from "sonner";

type Props = {
  user: {
    name: string;
    email: string;
    role: string;
  };
};

export function SettingsForm({ user }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);

    if (newPw.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (currentPw === newPw) {
      setError("New password must be different from current password.");
      return;
    }

    startTransition(async () => {
      try {
        const { error: authError } = await authClient.changePassword({
          currentPassword: currentPw,
          newPassword: newPw,
        });
        if (authError) {
          setError(authError.message || "Could not change password.");
          return;
        }
        setDone(true);
        setCurrentPw("");
        setNewPw("");
        setConfirm("");
        toast.success("Password changed", { description: "Your password has been updated." });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    });
  };

  const handleForgotFlow = () => {
    router.push("/forgot-password");
  };

  const roleLabel = user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
              <p className="font-medium mt-1">{user.name}</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <p className="font-medium mt-1 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {user.email}
              </p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
              <p className="font-medium mt-1 capitalize">{roleLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Change Password</CardTitle>
          <CardDescription>Update your password while staying logged in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current" className="text-xs uppercase tracking-wider text-muted-foreground">
                Current password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="current"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="pl-9 pr-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new" className="text-xs uppercase tracking-wider text-muted-foreground">
                New password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
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
            {done && (
              <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Password changed successfully.
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleForgotFlow}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Forgot your current password?
              </button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
