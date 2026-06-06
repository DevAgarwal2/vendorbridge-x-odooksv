"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => Promise<void> | void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
  className,
  showValue = true,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<number | null>(null);

  const display = optimistic ?? hover ?? value;
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";

  const handleClick = (n: number) => {
    if (readonly || !onChange) return;
    setOptimistic(n);
    startTransition(async () => {
      try {
        await onChange(n);
      } finally {
        setOptimistic(null);
      }
    });
  };

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.floor(display);
        const half = !filled && n - 0.5 <= display;
        return (
          <button
            key={n}
            type="button"
            disabled={readonly || pending}
            onMouseEnter={() => !readonly && setHover(n)}
            onClick={() => handleClick(n)}
            className={cn(
              "transition-transform",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default",
              pending && "opacity-50"
            )}
            aria-label={`Rate ${n} out of 5`}
          >
            <Star
              className={cn(
                sizeClass,
                filled || half
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className={cn("ml-1.5 font-medium tabular-nums", size === "sm" ? "text-xs" : "text-sm")}>
          {value > 0 ? value.toFixed(1) : "—"}
        </span>
      )}
    </div>
  );
}
