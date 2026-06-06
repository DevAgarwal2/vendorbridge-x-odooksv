"use client";

import { useState, useTransition } from "react";
import { Star, Lock } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { updateVendorRating } from "@/lib/actions";
import { toast } from "sonner";

export function VendorRatingEditor({ vendorId, rating, canEdit = true }: { vendorId: number; rating: number; canEdit?: boolean }) {
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

  if (!canEdit) {
    return (
      <div className="space-y-1.5">
        <StarRating value={currentRating} readonly size="lg" />
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Lock className="h-3 w-3" /> Only procurement officers can rate vendors
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StarRating value={currentRating} onChange={handleRate} size="lg" />
          <button
            type="button"
            onClick={() => {
              setCurrentRating(rating);
              setEditing(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={pending}
          >
            Cancel
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Click a star to update.</p>
      </div>
    );
  }

  if (rating <= 0) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span className="inline-flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="h-6 w-6 fill-transparent text-muted-foreground/40" />
          ))}
        </span>
        <span>Click to rate</span>
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
      className="inline-flex items-center gap-2 cursor-pointer group"
    >
      <StarRating value={currentRating} readonly size="lg" />
      <span className="text-xs text-muted-foreground group-hover:text-foreground">Click to edit</span>
    </span>
  );
}
