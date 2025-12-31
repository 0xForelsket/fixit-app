import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";

interface ManualEntryFormProps {
  onSubmit: (minutes: number, notes: string) => Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
  saving: boolean;
}

export function ManualEntryForm({
  onSubmit,
  isOpen,
  onClose,
  saving,
}: ManualEntryFormProps) {
  const [manualMinutes, setManualMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!manualMinutes) return;
    const success = await onSubmit(Number.parseInt(manualMinutes), notes);
    if (success) {
      setManualMinutes("");
      setNotes("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="rounded-2xl border-2 bg-white p-4 shadow-xl space-y-4 border-primary-100">
        <div className="flex items-center gap-2 mb-2">
          <Plus className="h-4 w-4 text-primary-600" />
          <h4 className="font-black uppercase tracking-tighter text-zinc-900">
            Manual Entry
          </h4>
        </div>
        <div className="flex gap-2">
          <FieldGroup label="Duration" className="flex-1">
            <div className="relative">
              <Input
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="Min"
                min="1"
                className="pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-zinc-400">
                Minutes
              </span>
            </div>
          </FieldGroup>
        </div>
        <FieldGroup label="Notes (Optional)">
          <Input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Completed inspection..."
          />
        </FieldGroup>
        <Button
          onClick={handleSubmit}
          disabled={!manualMinutes || saving}
          className="w-full h-12 rounded-xl bg-primary-600 font-black uppercase tracking-widest"
        >
          {saving ? "Adding..." : "Confirm Entry"}
        </Button>
      </div>
    </div>
  );
}
