"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { Layers, LayoutList } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

export function ViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "list";

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  };

  return (
    <SegmentedControl
      selectedValue={currentView}
      options={[
        {
          label: "List",
          value: "list",
          icon: LayoutList,
          href: `${pathname}?${createQueryString("view", "list")}`,
        },
        {
          label: "Hierarchy",
          value: "tree",
          icon: Layers,
          href: `${pathname}?${createQueryString("view", "tree")}`,
        },
      ]}
    />
  );
}
