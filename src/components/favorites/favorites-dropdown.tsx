"use client";

import {
  type FavoriteWithEquipment,
  getUserFavorites,
} from "@/actions/favorites";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { MonitorCog, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface FavoritesDropdownProps {
  className?: string;
}

export function FavoritesDropdown({ className }: FavoritesDropdownProps) {
  const [favorites, setFavorites] = useState<FavoriteWithEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  const loadFavorites = async () => {
    setIsLoading(true);
    const result = await getUserFavorites();
    if (result.success && result.data) {
      setFavorites(result.data);
    }
    setIsLoading(false);
  };

  const equipmentFavorites = favorites.filter(
    (f) => f.entityType === "equipment" && f.equipment
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-muted-foreground hover:text-yellow-500 hover:bg-muted relative",
            className
          )}
          title="Favorites"
          aria-label="View favorites"
        >
          <Star className="h-5 w-5" />
          {equipmentFavorites.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-white">
              {equipmentFavorites.length > 9 ? "9+" : equipmentFavorites.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          Favorite Equipment
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : equipmentFavorites.length === 0 ? (
          <div className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No favorites yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Star equipment to add them here for quick access
            </p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {equipmentFavorites.map((favorite) => (
              <DropdownMenuItem
                key={favorite.id}
                asChild
                className="cursor-pointer"
              >
                <Link
                  href={`/assets/equipment/${favorite.equipment?.code ?? ""}`}
                  className="flex items-start gap-3 p-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <MonitorCog className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {favorite.equipment?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-muted-foreground">
                        {favorite.equipment?.code}
                      </span>
                      {favorite.equipment?.status && (
                        <StatusBadge
                          status={favorite.equipment.status}
                          className="text-[10px] py-0 px-1.5"
                        />
                      )}
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        {equipmentFavorites.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link
                href="/assets/equipment"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                View all equipment
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
