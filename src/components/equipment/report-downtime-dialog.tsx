"use client";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getCsrfToken } from "@/lib/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const downtimeReasonLabels: Record<string, string> = {
  mechanical_failure: "Mechanical Failure",
  electrical_failure: "Electrical Failure",
  no_operator: "No Operator",
  no_materials: "No Materials",
  planned_maintenance: "Planned Maintenance",
  changeover: "Changeover",
  other: "Other",
};

const downtimeReasons = [
  "mechanical_failure",
  "electrical_failure",
  "no_operator",
  "no_materials",
  "planned_maintenance",
  "changeover",
  "other",
] as const;

const reportDowntimeSchema = z.object({
  reasonCode: z.enum(downtimeReasons),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  notes: z.string().max(1000, "Notes too long").optional(),
});

type ReportDowntimeFormValues = z.infer<typeof reportDowntimeSchema>;

interface ReportDowntimeDialogProps {
  equipmentId: string;
}

export function ReportDowntimeDialog({ equipmentId }: ReportDowntimeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Default start time to now
  const now = new Date();
  const localISOString = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const form = useForm<ReportDowntimeFormValues>({
    resolver: zodResolver(reportDowntimeSchema),
    defaultValues: {
      reasonCode: "mechanical_failure",
      startTime: localISOString,
      endTime: "",
      notes: "",
    },
  });

  async function onSubmit(values: ReportDowntimeFormValues) {
    setIsSubmitting(true);
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(`/api/equipment/${equipmentId}/downtime`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken ?? "",
        },
        body: JSON.stringify({
          reasonCode: values.reasonCode,
          startTime: new Date(values.startTime),
          endTime: values.endTime ? new Date(values.endTime) : null,
          notes: values.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to report downtime");
      }

      toast({
        title: "Downtime Reported",
        description: "The downtime event has been logged.",
      });
      setOpen(false);
      form.reset({
        reasonCode: "mechanical_failure",
        startTime: localISOString,
        endTime: "",
        notes: "",
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to report downtime",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-amber-600 border-amber-300 hover:bg-amber-50"
        >
          <Clock className="h-3 w-3 mr-1" />
          Report Downtime
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Report Downtime
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-zinc-500">
            Log equipment downtime for reliability tracking.
          </DialogDescription>
        </DialogHeader>
        <div className="h-px bg-zinc-100 my-2" />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 py-2"
          >
            <FormField
              control={form.control}
              name="reasonCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {downtimeReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {downtimeReasonLabels[reason]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    End Time{" "}
                    <span className="text-muted-foreground font-normal">
                      (leave blank if ongoing)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-lg font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
              >
                {isSubmitting ? "Reporting..." : "Report Downtime"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
