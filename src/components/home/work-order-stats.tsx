import { ClipboardList } from "lucide-react";

interface WorkOrderStatsProps {
  statusCounts: {
    operational: number;
    down: number;
    maintenance: number;
  };
}

export function WorkOrderStats({ statusCounts }: WorkOrderStatsProps) {
  return (
    <div>
      <h3 className="text-lg font-black tracking-tight text-zinc-800 uppercase flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary-500" />
        Work orders
      </h3>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 relative overflow-hidden group animate-stagger-1 animate-in slide-in-from-bottom-2 duration-500">
          <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-1">
            Open
          </p>
          <p className="text-3xl font-black text-red-700">
            {statusCounts.down}
          </p>
          <span className="text-[10px] text-red-500 font-bold ml-1">nos.</span>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-100 rounded-full transition-transform group-hover:scale-150" />
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 relative overflow-hidden group animate-stagger-2 animate-in slide-in-from-bottom-2 duration-500">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            Repairing
          </p>
          <p className="text-3xl font-black text-blue-700">
            {statusCounts.maintenance}
          </p>
          <span className="text-[10px] text-blue-500 font-bold ml-1">nos.</span>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-100 rounded-full transition-transform group-hover:scale-150" />
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 relative overflow-hidden group animate-stagger-3 animate-in slide-in-from-bottom-2 duration-500">
          <p className="text-orange-600 text-xs font-bold uppercase tracking-wider mb-1">
            Completed
          </p>
          <p className="text-3xl font-black text-orange-700">
            {statusCounts.operational}
          </p>
          <span className="text-[10px] text-orange-500 font-bold ml-1">
            nos.
          </span>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-orange-100 rounded-full transition-transform group-hover:scale-150" />
        </div>
      </div>
    </div>
  );
}
