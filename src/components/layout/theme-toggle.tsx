"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Palette, Zap, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {theme === "elegant" && <Palette className="h-5 w-5" />}
          {theme === "industrial" && <Zap className="h-5 w-5" />}
          {theme === "dark" && <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-border bg-card">
        <DropdownMenuItem 
          onClick={() => setTheme("elegant")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Palette className="h-4 w-4" />
          <span>Elegant (New)</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("industrial")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Zap className="h-4 w-4" />
          <span>Industrial (Classic)</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          <span>Dark Mode</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
