"use client";

import { logout } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ChevronsUpDown,
  Cog,
  Download,
  Globe,
  HelpCircle,
  Keyboard,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { NavTooltip } from "./nav-tooltip";

interface SidebarUserMenuProps {
  user: {
    name: string;
    roleName: string;
    employeeId: string;
  };
  avatarUrl?: string | null;
  isCollapsed?: boolean;
}

export function SidebarUserMenu({
  user,
  avatarUrl,
  isCollapsed,
}: SidebarUserMenuProps) {
  return (
    <div className="border-t border-border p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:pb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center rounded-2xl bg-muted/30 p-2 transition-all hover:bg-muted/50 border border-border group relative outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isCollapsed ? "justify-center px-2" : "gap-3 p-3"
            )}
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted shadow-sm ring-1 ring-border group-hover:ring-primary/50 transition-all">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted font-bold text-xs uppercase">
                  {user.name.slice(0, 2)}
                </div>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-1 flex-col text-left overflow-hidden animate-in fade-in slide-in-from-left-2">
                  <p className="truncate text-sm font-bold text-foreground leading-tight">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="flex-none rounded bg-muted px-1 py-0.5 text-[10px] font-mono font-bold uppercase tracking-tight text-muted-foreground border border-border">
                      {user.roleName}
                    </span>
                  </div>
                </div>
                <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
              </>
            )}
            <NavTooltip label={user.name} show={!!isCollapsed} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 z-[100]"
          side={isCollapsed ? "right" : "top"}
          align="end"
          sideOffset={8}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.employeeId} - {user.roleName}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile/settings" className="w-full cursor-pointer">
                <Cog className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Globe className="mr-2 h-4 w-4" />
              <span>Language</span>
              <span className="ml-auto text-xs text-muted-foreground opacity-70">
                (Coming Soon)
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/docs" className="w-full cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Get help</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                document.dispatchEvent(
                  new CustomEvent("toggle-keyboard-shortcuts")
                )
              }
              className="cursor-pointer"
            >
              <Keyboard className="mr-2 h-4 w-4" />
              <span>Keyboard Shortcuts</span>
              <span className="ml-auto text-xs text-muted-foreground opacity-70">
                ?
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/install" className="w-full cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                <span>Download App</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
