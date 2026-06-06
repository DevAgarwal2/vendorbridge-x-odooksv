"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  param?: string;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
};

export function RealtimeSearch({
  param = "search",
  placeholder = "Search…",
  debounceMs = 250,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(param) ?? "";

  // uncontrolled input — the key resets it when the URL changes (back button, clear, etc.)
  const inputKey = React.useMemo(
    () => `${pathname}:${param}:${urlValue}`,
    [pathname, param, urlValue]
  );

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function commit(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) params.set(param, next);
    else params.delete(param);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(v), debounceMs);
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current);
    commit("");
  }

  return (
    <div className={`relative ${className ?? "w-full sm:w-72"}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        key={inputKey}
        type="search"
        defaultValue={urlValue}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label={placeholder}
      />
      {urlValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="absolute right-0.5 top-0.5 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
