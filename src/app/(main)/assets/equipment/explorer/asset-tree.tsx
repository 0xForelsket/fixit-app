"use client";

import { useMemo, useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  MonitorCog, 
  Layers, 
  Plus, 
  ExternalLink,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Equipment {
  id: number;
  name: string;
  code: string;
  status: string;
  locationId: number;
  parentId: number | null;
  location?: { name: string } | null;
}

interface TreeNode extends Equipment {
  children: TreeNode[];
}

interface AssetTreeProps {
  initialEquipment: Equipment[];
}

export function AssetTree({ initialEquipment }: AssetTreeProps) {
  const [search, setSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // Build tree structure
  const tree = useMemo(() => {
    const nodesMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    // Pre-create all nodes
    for (const item of initialEquipment) {
      nodesMap.set(item.id, { ...item, children: [] });
    }

    // Link parents and children
    for (const node of nodesMap.values()) {
      if (node.parentId && nodesMap.has(node.parentId)) {
        nodesMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [initialEquipment]);

  const toggleNode = (id: number) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedNodes(next);
  };

  const expandAll = () => {
    const allIds = initialEquipment.map((e) => e.id);
    setExpandedNodes(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Helper to check if a node or any of its children match search
  const matchesSearch = (node: TreeNode, term: string): boolean => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    const selfMatches =
      node.name.toLowerCase().includes(lowerTerm) ||
      node.code.toLowerCase().includes(lowerTerm);
    
    if (selfMatches) return true;
    return node.children.some(child => matchesSearch(child, term));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)]">
      {/* Toolbar */}
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="FILTER HIERARCHY BY NAME OR CODE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-xs font-bold tracking-wider placeholder:text-zinc-500 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all uppercase"
          />
          {search && (
            <button 
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={expandAll} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900">
            EXPAND ALL
          </Button>
          <div className="w-px h-4 bg-zinc-200" />
          <Button variant="ghost" size="sm" onClick={collapseAll} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900">
            COLLAPSE
          </Button>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="h-12 w-12 text-zinc-200 mb-4" />
            <h3 className="text-sm font-black text-zinc-900 uppercase">Registry Empty</h3>
            <p className="text-xs text-zinc-400 max-w-[200px] mt-2">
              No equipment found in the system.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map(node => (
              <TreeItem 
                key={node.id} 
                node={node} 
                level={0} 
                expandedNodes={expandedNodes} 
                onToggle={toggleNode}
                search={search}
                matchesSearch={matchesSearch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TreeItem({ 
  node, 
  level, 
  expandedNodes, 
  onToggle, 
  search,
  matchesSearch 
}: { 
  node: TreeNode; 
  level: number;
  expandedNodes: Set<number>;
  onToggle: (id: number) => void;
  search: string;
  matchesSearch: (node: TreeNode, term: string) => boolean;
}) {
  const isExpanded = expandedNodes.has(node.id) || (search.length > 0 && matchesSearch(node, search));
  const hasChildren = node.children.length > 0;
  const isVisible = matchesSearch(node, search);

  if (!isVisible && search.length > 0) return null;

  return (
    <div className="space-y-1">
      <div 
        className={cn(
          "group flex items-center gap-2 rounded-xl border p-2 transition-all hover:border-zinc-300 hover:bg-white active:scale-[0.99]",
          level === 0 ? "bg-zinc-50/50 border-zinc-200" : "bg-transparent border-transparent",
          search && node.name.toLowerCase().includes(search.toLowerCase()) ? "ring-2 ring-primary-500/20 bg-primary-50/10 border-primary-200" : ""
        )}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {hasChildren ? (
            <button 
              type="button"
              onClick={() => onToggle(node.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 transition-colors"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
            {hasChildren ? <Layers className="h-4 w-4" /> : <MonitorCog className="h-4 w-4" />}
          </div>

          <div className="min-w-0 pl-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-900 uppercase tracking-tight truncate leading-none">
                {node.name}
              </span>
              <span className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[9px] font-bold text-zinc-500 uppercase leading-none">
                {node.code}
              </span>
            </div>
            {node.location && (
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5 block">
                {node.location.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={node.status} className="scale-75 origin-right" />
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild title="See Sub-asset">
              <Link href={`/assets/equipment/new?parentId=${node.id}&locationId=${node.locationId}`}>
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild title="Edit Asset">
              <Link href={`/assets/equipment/${node.id}/edit`}>
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary-600 hover:text-primary-700" asChild title="View Details">
              <Link href={`/assets/equipment/${node.id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical line indicator */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-px bg-zinc-100" 
            style={{ marginLeft: `${level * 24 + 11.5}px` }}
          />
          <div className="space-y-1">
            {node.children.map(child => (
              <TreeItem 
                key={child.id} 
                node={child} 
                level={level + 1} 
                expandedNodes={expandedNodes} 
                onToggle={onToggle}
                search={search}
                matchesSearch={matchesSearch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
