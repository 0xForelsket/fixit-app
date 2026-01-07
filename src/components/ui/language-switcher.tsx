"use client";

import { setLocale } from "@/actions/locale";
import { type Locale, localeNativeNames, locales } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface LanguageSwitcherProps {
  /** Show full language name instead of just the icon */
  showLabel?: boolean;
  /** Additional className */
  className?: string;
}

export function LanguageSwitcher({
  showLabel = false,
  className,
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(async () => {
      await setLocale(newLocale);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? "default" : "icon"}
          className={cn(
            "relative",
            isPending && "opacity-50 pointer-events-none",
            className
          )}
          aria-label={t("language")}
        >
          <Globe className="h-4 w-4" />
          {showLabel && (
            <span className="ml-2">{localeNativeNames[locale]}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleLocaleChange(l)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              l === locale && "bg-accent text-accent-foreground"
            )}
          >
            <span>{localeNativeNames[l]}</span>
            {l === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageSwitcherSub() {
  const locale = useLocale() as Locale;
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(async () => {
      await setLocale(newLocale);
    });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={cn(isPending && "opacity-50 pointer-events-none")}
      >
        <Globe className="mr-2 h-4 w-4" />
        <span>{t("language")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="min-w-[160px]">
          {locales.map((l) => (
            <DropdownMenuItem
              key={l}
              onClick={() => handleLocaleChange(l)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                l === locale && "bg-accent text-accent-foreground"
              )}
            >
              <span>{localeNativeNames[l]}</span>
              {l === locale && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
