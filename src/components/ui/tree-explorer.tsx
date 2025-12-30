"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Layers, Search, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

export interface BaseTreeItem {
  id: number | string;
  parentId: number | string | null;
}

interface InternalTreeNode<T> extends BaseTreeItem {
  data: T;
  children: InternalTreeNode<T>[];
}

interface TreeExplorerProps<T extends BaseTreeItem> {
  items: T[];
  renderIcon?: (item: T, hasChildren: boolean) => ReactNode;
  renderTitle: (item: T) => ReactNode;
  renderSubtitle?: (item: T) => ReactNode;
  renderBadges?: (item: T) => ReactNode;
  renderActions?: (item: T) => ReactNode;
  getSearchTerms?: (item: T) => string[];
  emptyMessage?: string;
  className?: string;
}

export function TreeExplorer<T extends BaseTreeItem>({
  items,
  renderIcon,
  renderTitle,
  renderSubtitle,
  renderBadges,
  renderActions,
  getSearchTerms,
  emptyMessage = "No items found in the registry.",
  className,
}: TreeExplorerProps<T>) {
  const [search, setSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<number | string>>(
    new Set()
  );

  // Build tree structure
  const tree = useMemo(() => {
    const nodesMap = new Map<number | string, InternalTreeNode<T>>();
    const roots: InternalTreeNode<T>[] = [];

    // Pre-create all nodes
    for (const item of items) {
      nodesMap.set(item.id, { ...item, data: item, children: [] });
    }

    // Link parents and children
    for (const node of nodesMap.values()) {
      if (node.parentId !== null && nodesMap.has(node.parentId)) {
        nodesMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [items]);

  const toggleNode = (id: number | string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedNodes(next);
  };

  const expandAll = () => {
    const allIds = items.map((e) => e.id);
    setExpandedNodes(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Helper to check if a node or any of its children match search
  const itemMatchesSearch = (item: T, term: string): boolean => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    const searchTerms = getSearchTerms ? getSearchTerms(item) : [];

    return searchTerms.some((t) => t.toLowerCase().includes(lowerTerm));
  };

  const nodeMatchesSearch = (
    node: InternalTreeNode<T>,
    term: string
  ): boolean => {
    if (!term) return true;
    if (itemMatchesSearch(node.data, term)) return true;
    return node.children.some((child) => nodeMatchesSearch(child, term));
  };

  return (
    <div
      className={cn(
        "flex flex-col h-[600px] bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-colors",
        className
      )}
    >
      {/* Toolbar */}
      <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="FILTER BY SEARCH TERMS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-xs font-bold tracking-wider placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground px-3"
          >
            EXPAND ALL
          </Button>
          <div className="w-px h-4 bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground px-3"
          >
            COLLAPSE
          </Button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-sm font-black text-foreground uppercase">
              Registry Empty
            </h3>
            <p className="text-xs text-muted-foreground max-w-[200px] mt-2">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {tree.map((node) => (
              <TreeExplorerItem
                key={node.id}
                node={node}
                level={0}
                expandedNodes={expandedNodes}
                onToggle={toggleNode}
                search={search}
                nodeMatchesSearch={nodeMatchesSearch}
                itemMatchesSearch={itemMatchesSearch}
                renderIcon={renderIcon}
                renderTitle={renderTitle}
                renderSubtitle={renderSubtitle}
                renderBadges={renderBadges}
                renderActions={renderActions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TreeExplorerItemProps<T extends BaseTreeItem> {
  node: InternalTreeNode<T>;
  level: number;
  expandedNodes: Set<number | string>;
  onToggle: (id: number | string) => void;
  search: string;
  nodeMatchesSearch: (node: InternalTreeNode<T>, term: string) => boolean;
  itemMatchesSearch: (item: T, term: string) => boolean;
  renderIcon?: (item: T, hasChildren: boolean) => ReactNode;
  renderTitle: (item: T) => ReactNode;
  renderSubtitle?: (item: T) => ReactNode;
  renderBadges?: (item: T) => ReactNode;
  renderActions?: (item: T) => ReactNode;
}

function TreeExplorerItem<T extends BaseTreeItem>({
  node,
  level,
  expandedNodes,
  onToggle,
  search,
  nodeMatchesSearch,
  itemMatchesSearch,
  renderIcon,
  renderTitle,
  renderSubtitle,
  renderBadges,
  renderActions,
}: TreeExplorerItemProps<T>) {
  const isExpanded =
    expandedNodes.has(node.id) ||
    (search.length > 0 && nodeMatchesSearch(node, search));
  const hasChildren = node.children.length > 0;
  const isVisible = nodeMatchesSearch(node, search);
  const isDirectMatch =
    search.length > 0 && itemMatchesSearch(node.data, search);

  if (!isVisible && search.length > 0) return null;

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "group flex items-center gap-3 rounded-xl border p-3 transition-all hover:border-border hover:bg-muted/50 active:scale-[0.995]",
          level === 0
            ? "bg-muted/30 border-border"
            : "bg-transparent border-transparent",
          isDirectMatch
            ? "ring-2 ring-primary/20 bg-primary/5 border-primary/30"
            : ""
        )}
        style={{ marginLeft: `${level * 32}px` }}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(node.id)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          ) : (
            <div className="w-8" />
          )}

          {renderIcon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              {renderIcon(node.data, hasChildren)}
            </div>
          )}

          <div className="min-w-0 pl-1 py-1">
            <div className="flex items-center gap-3">
              <div className="text-sm font-black text-foreground uppercase tracking-tight truncate leading-none">
                {renderTitle(node.data)}
              </div>
            </div>
            {renderSubtitle && (
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 block">
                {renderSubtitle(node.data)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {renderBadges && (
            <div className="flex items-center gap-2">
              {renderBadges(node.data)}
            </div>
          )}

          {renderActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
              {renderActions(node.data)}
            </div>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical line indicator */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-border/50"
            style={{ marginLeft: `${level * 32 + 15.5}px` }}
          />
          <div className="space-y-1.5">
            {node.children.map((child) => (
              <TreeExplorerItem
                key={child.id}
                node={child}
                level={level + 1}
                expandedNodes={expandedNodes}
                onToggle={onToggle}
                search={search}
                nodeMatchesSearch={nodeMatchesSearch}
                itemMatchesSearch={itemMatchesSearch}
                renderIcon={renderIcon}
                renderTitle={renderTitle}
                renderSubtitle={renderSubtitle}
                renderBadges={renderBadges}
                renderActions={renderActions}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
