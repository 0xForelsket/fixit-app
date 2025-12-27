"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EquipmentStat {
  id: number;
  name: string;
  code: string;
  breakdowns: number;
  downtimeHours: number;
  totalTickets: number;
}

interface EquipmentHealthTableProps {
  data: EquipmentStat[];
}

export function EquipmentHealthTable({ data }: EquipmentHealthTableProps) {
  return (
    <Card className="card-industrial border-zinc-200 shadow-sm animate-in animate-stagger-3">
      <CardHeader className="border-b border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-danger-500 rounded-full" />
          <CardTitle className="text-lg font-black tracking-tight">
            EQUIPMENT STRESS REPORT
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4">
          {data.length === 0 ? (
            <p className="text-zinc-400 text-center py-8 font-medium italic">
              No breakdown data detected in active window.
            </p>
          ) : (
            data.map((equipment, index) => (
              <div
                key={equipment.id}
                className="group flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/30 hover:bg-white hover:border-zinc-200 transition-all hover-lift"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono text-xs font-black">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-black text-zinc-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">
                      {equipment.name}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                      ID: {equipment.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-end">
                    <p className="text-lg font-mono font-black text-danger-600 leading-none">
                      {equipment.breakdowns}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                      FAILURES
                    </p>
                  </div>
                  <div className="flex flex-col items-end w-24">
                    <p className="text-lg font-mono font-black text-zinc-900 leading-none">
                      {equipment.downtimeHours}h
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                      DOWNTIME
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
