import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, Pause, Play, Plus } from "lucide-react";
import { useState } from "react";

interface TimerDisplayProps {
  isRunning: boolean;
  elapsedSeconds: number;
  saving: boolean;
  onStart: () => void;
  onStop: (notes: string) => void;
  onToggleManual: () => void;
}

export function TimerDisplay({
  isRunning,
  elapsedSeconds,
  saving,
  onStart,
  onStop,
  onToggleManual,
}: TimerDisplayProps) {
  const [notes, setNotes] = useState("");

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStop = () => {
    onStop(notes);
    setNotes("");
  };

  return (
    <div className="space-y-4">
      {/* Main Timer Card */}
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-500",
          isRunning
            ? "bg-primary-900 border-primary-500 shadow-xl shadow-primary-900/20"
            : ""
        )}
      >
        {isRunning && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none animate-pulse" />
        )}

        <CardContent className="relative flex flex-col items-center justify-center gap-4 p-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                isRunning
                  ? "bg-primary-500 text-white"
                  : "bg-zinc-100 text-zinc-400"
              )}
            >
              <Clock
                className={cn("h-5 w-5", isRunning && "animate-spin-slow")}
              />
            </div>
            <p
              className={cn(
                "text-xs font-black uppercase tracking-widest",
                isRunning ? "text-primary-400" : "text-zinc-500"
              )}
            >
              {isRunning ? "Session Active" : "Ready to Log"}
            </p>
          </div>

          <div className="text-center">
            <p
              className={cn(
                "font-mono text-5xl font-black tracking-tighter sm:text-6xl",
                isRunning ? "text-white" : "text-zinc-900"
              )}
              suppressHydrationWarning
            >
              {formatTime(elapsedSeconds)}
            </p>
            {isRunning && (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-400 animate-pulse">
                Recording Labor...
              </p>
            )}
          </div>

          <div className="flex w-full gap-3 pt-2">
            {isRunning ? (
              <Button
                onClick={handleStop}
                variant="destructive"
                disabled={saving}
                className="h-14 flex-1 rounded-xl text-lg font-black uppercase tracking-widest shadow-lg active:scale-95"
              >
                <Pause className="mr-2 h-6 w-6 fill-current" />
                {saving ? "Saving..." : "Stop Work"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={onStart}
                  className="h-14 flex-[2] rounded-xl bg-primary-600 text-lg font-black uppercase tracking-widest text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 active:scale-95 transition-all"
                >
                  <Play className="mr-2 h-6 w-6 fill-current" />
                  Start Timer
                </Button>
                <Button
                  variant="outline"
                  onClick={onToggleManual}
                  className="h-14 flex-1 rounded-xl border-2 font-black uppercase tracking-widest active:scale-95"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Session Notes */}
      {isRunning && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What are you working on?"
              className="w-full rounded-xl border-2 border-primary-100 bg-primary-50 px-4 py-3 text-sm font-bold text-primary-900 placeholder:text-primary-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-ping" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
