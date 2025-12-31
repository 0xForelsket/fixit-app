"use client";

import { toggleFavorite } from "@/actions/favorites";
import { Button } from "@/components/ui/button";
import type { FavoriteEntityType } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useOptimistic, useTransition } from "react";

interface FavoriteButtonProps {
  entityType: FavoriteEntityType;
  entityId: number;
  isFavorited: boolean;
  variant?: "icon" | "default";
  className?: string;
}

export function FavoriteButton({
  entityType,
  entityId,
  isFavorited,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorited, setOptimisticFavorited] = useOptimistic(
    isFavorited,
    (_, newValue: boolean) => newValue
  );

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticFavorited(!optimisticFavorited);
      await toggleFavorite(entityType, entityId);
    });
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "rounded-xl transition-all",
          optimisticFavorited
            ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
            : "text-muted-foreground hover:text-yellow-500 hover:bg-muted",
          className
        )}
        title={
          optimisticFavorited ? "Remove from favorites" : "Add to favorites"
        }
        aria-label={
          optimisticFavorited ? "Remove from favorites" : "Add to favorites"
        }
      >
        <Star
          className={cn(
            "h-4 w-4 transition-all",
            optimisticFavorited && "fill-current",
            isPending && "animate-pulse"
          )}
        />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "transition-all",
        optimisticFavorited
          ? "border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
          : "hover:border-yellow-500 hover:text-yellow-500",
        className
      )}
    >
      <Star
        className={cn(
          "mr-2 h-4 w-4",
          optimisticFavorited && "fill-current",
          isPending && "animate-pulse"
        )}
      />
      {optimisticFavorited ? "Favorited" : "Favorite"}
    </Button>
  );
}
