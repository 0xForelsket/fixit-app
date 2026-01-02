"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatWorkOrderId, getWorkOrderPath } from "@/lib/format-ids";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface TopCostlyWorkOrder {
  id: string;
  displayId: number;
  title: string;
  equipmentName: string;
  equipmentCode: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  status: string;
  createdAt: Date;
}

interface CostlyWorkOrdersTableProps {
  data: TopCostlyWorkOrder[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const statusStyles: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-zinc-100 text-zinc-800 border-zinc-200",
};

export function CostlyWorkOrdersTable({ data }: CostlyWorkOrdersTableProps) {
  return (
    <Card className="card-industrial border-zinc-200 shadow-sm animate-in">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-danger-500 rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            TOP COSTLY WORK ORDERS
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No work order cost data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    WO#
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    Title
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    Equipment
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 text-right">
                    Labor
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 text-right">
                    Parts
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500 text-right">
                    Total
                  </TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-zinc-500">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((wo, index) => (
                  <TableRow
                    key={wo.id}
                    className={cn(
                      "transition-colors hover:bg-zinc-50",
                      index === 0 && "bg-danger-50/30"
                    )}
                  >
                    <TableCell className="font-mono font-bold text-xs">
                      <Link
                        href={getWorkOrderPath(wo.displayId)}
                        className="text-primary hover:underline"
                      >
                        {formatWorkOrderId(wo.displayId)}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium text-sm">
                      <Link
                        href={getWorkOrderPath(wo.displayId)}
                        className="hover:text-primary hover:underline"
                      >
                        {wo.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {wo.equipmentName}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {wo.equipmentCode}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(wo.laborCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(wo.partsCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold">
                      {formatCurrency(wo.totalCost)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          statusStyles[wo.status] || statusStyles.open
                        )}
                      >
                        {wo.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
