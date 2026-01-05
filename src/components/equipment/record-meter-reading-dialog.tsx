"use client";

import { recordReading } from "@/actions/meters";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Gauge } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-12 rounded-xl bg-primary-600 font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all"
    >
      {pending ? "Saving..." : "Save Reading"}
    </Button>
  );
}

interface RecordMeterReadingDialogProps {
  meterId: string;
  meterName: string;
  currentReading: string | null;
  unit: string;
  trigger?: React.ReactNode;
}

export function RecordMeterReadingDialog({
  meterId,
  meterName,
  currentReading,
  unit,
  trigger,
}: RecordMeterReadingDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function clientAction(formData: FormData) {
    const result = await recordReading(null, formData);
    if (result?.success) {
      toast({
        title: "Reading Recorded",
        description: `Successfully recorded reading for ${meterName}`,
      });
      setOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result?.error || "Failed to record reading",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Gauge className="h-4 w-4" />
            Record Reading
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Record Reading
          </DialogTitle>
          <DialogDescription>
            Enter the current reading for {meterName}.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 my-2 border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Previous Reading</span>
            <span className="font-mono font-medium">
              {currentReading || "0"} {unit}
            </span>
          </div>
        </div>

        <form
          action={(formData) => {
            formData.set("meterId", meterId);
            clientAction(formData);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="reading">New Reading</Label>
            <div className="relative">
              <Input
                id="reading"
                name="reading"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                className="pr-12 text-lg font-mono"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground text-sm font-medium">
                {unit}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any observations..."
              rows={2}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
