"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { AttachmentWithUrl } from "@/lib/types/attachments";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import {
  File,
  FileImage,
  FileText,
  Filter,
  Folder,
  Grid,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface DocumentsViewProps {
  initialAttachments: AttachmentWithUrl[];
}

export function DocumentsView({ initialAttachments }: DocumentsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentEntityType = searchParams.get("entityType");
  const currentMimeType = searchParams.get("mimeType");
  const searchQuery = searchParams.get("search") || "";
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <FileImage className="h-8 w-8 text-purple-500" />;
    if (mimeType === "application/pdf") return <FileText className="h-8 w-8 text-red-500" />;
    return <File className="h-8 w-8 text-blue-500" />;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="w-full border-r bg-muted/10 lg:w-64">
        <div className="p-4">
          <h2 className="mb-4 px-2 text-lg font-semibold tracking-tight">Library</h2>
          <div className="space-y-1">
            <Button
              variant={(!currentEntityType && !currentMimeType) ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 cursor-pointer"
              onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete("entityType");
                  params.delete("mimeType");
                  router.replace(`${pathname}?${params.toString()}`);
              }}
            >
              <LayoutGrid className="h-4 w-4" />
              All Documents
            </Button>
          </div>

          <Separator className="my-4" />

          <h3 className="mb-2 px-2 text-sm font-medium text-muted-foreground">Folders</h3>
          <div className="space-y-1">
            <Button
              variant={currentEntityType === "work_order" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 cursor-pointer"
              onClick={() => handleFilter("entityType", "work_order")}
            >
              <Folder className="h-4 w-4 text-blue-500" />
              Work Orders
            </Button>
            <Button
              variant={currentEntityType === "equipment" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 cursor-pointer"
              onClick={() => handleFilter("entityType", "equipment")}
            >
              <Folder className="h-4 w-4 text-orange-500" />
              Equipment
            </Button>
          </div>

          <Separator className="my-4" />

          <h3 className="mb-2 px-2 text-sm font-medium text-muted-foreground">Type</h3>
          <div className="space-y-1">
             <Button
              variant={currentMimeType?.startsWith("image") ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 cursor-pointer"
              onClick={() => handleFilter("mimeType", "image")}
            >
              <FileImage className="h-4 w-4" />
              Images
            </Button>
            <Button
              variant={currentMimeType === "application/pdf" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 cursor-pointer"
              onClick={() => handleFilter("mimeType", "application/pdf")}
            >
              <FileText className="h-4 w-4" />
              PDFs
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              defaultValue={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn("cursor-pointer", viewMode === "grid" && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn("cursor-pointer", viewMode === "list" && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File Grid/List */}
        <ScrollArea className="flex-1 p-4">
          {initialAttachments.length === 0 ? (
             <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-muted p-6">
                  <File className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No documents found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search query.
                  </p>
                </div>
             </div>
          ) : (
            <div className={cn(
              "grid gap-4",
              viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1"
            )}>
              {initialAttachments.map((file) => (
                <Link
                  key={file.id}
                  href={file.url} 
                  target="_blank"
                  className={cn(
                    "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md",
                     viewMode === "list" && "flex-row items-center p-3"
                  )}
                >
                  {viewMode === "grid" ? (
                    <>
                      <div className="flex aspect-square items-center justify-center bg-muted/20 p-6 group-hover:bg-muted/40 transition-colors">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="flex flex-col p-3">
                         <span className="truncate text-sm font-medium leading-none mb-1">{file.filename}</span>
                           <div className="flex justify-between text-xs text-muted-foreground">
                           <span>{formatBytes(file.sizeBytes)}</span>
                           <span className="max-w-[100px] truncate" title={file.entityName || `#${file.entityId}`}>
                             {file.entityName || `#${file.entityId}`}
                           </span>
                         </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mr-4 flex h-10 w-10 items-center justify-center rounded bg-muted/20">
                         {getFileIcon(file.mimeType)}
                      </div>
                      <div className="flex flex-1 flex-col">
                         <span className="text-sm font-medium">{file.filename}</span>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <span>{formatBytes(file.sizeBytes)}</span>
                           <span>•</span>
                           <span className="uppercase">{file.entityType.replace("_", " ")}</span>
                           <span>•</span>
                           <span className="font-medium">{file.entityName || `#${file.entityId}`}</span>
                         </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
