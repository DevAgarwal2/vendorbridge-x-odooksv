"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { updateVendorRating } from "@/lib/actions";
import { toast } from "sonner";

export function VendorRatingCell({ vendorId, rating }: { vendorId: number; rating: number }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [currentRating, setCurrentRating] = useState(rating);

  const handleRate = async (val: number) => {
    if (val === currentRating) {
      setEditing(false);
      return;
    }
    setCurrentRating(val);
    startTransition(async () => {
      const res = await updateVendorRating(vendorId, val);
      if (res.success) {
        toast.success("Rating updated", { description: `Set to ${val.toFixed(1)}/5` });
        setEditing(false);
      } else {
        setCurrentRating(rating);
        toast.error("Could not update rating", { description: res.error });
      }
    });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <StarRating value={currentRating} onChange={handleRate} size="sm" />
        <button
          type="button"
          onClick={() => {
            setCurrentRating(rating);
            setEditing(false);
          }}
          className="text-xs text-muted-foreground hover:text-foreground ml-1"
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (rating <= 0) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <Star className="h-3.5 w-3.5 fill-transparent text-muted-foreground/40" />
        Rate
      </button>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className="inline-flex items-center cursor-pointer"
      title="Click to edit rating"
    >
      <StarRating value={rating} readonly size="sm" />
    </span>
  );
}

