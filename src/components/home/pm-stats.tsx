import { Wrench } from "lucide-react";

export function PMStats() {
  return (
    <div>
      <h3 className="text-lg font-black tracking-tight text-zinc-800 uppercase flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary-500" />
        Preventive Maintenance
      </h3>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100">
          <p className="text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            Due soon
          </p>
          <p className="text-3xl font-black text-primary-700">51</p>
          <span className="text-[10px] text-primary-500 font-bold ml-1">
            nos.
          </span>
        </div>
        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-wider mb-1">
            Closed
          </p>
          <p className="text-3xl font-black text-zinc-700">3</p>
          <span className="text-[10px] text-zinc-500 font-bold ml-1">nos.</span>
        </div>
      </div>
    </div>
  );
}
