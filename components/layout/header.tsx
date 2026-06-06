"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Header({ user }: { user?: { name?: string; email?: string; role?: string } }) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0].toUpperCase() || "U";

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card shrink-0">
      <div />
      <div className="flex items-center gap-4">
        {user?.role && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {user.role.replace("_", " ")}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Log out
        </button>
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
