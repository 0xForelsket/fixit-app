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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getCsrfToken } from "@/lib/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const meterReadingFormSchema = z.object({
  reading: z.coerce.number().min(0, "Reading cannot be negative"),
  notes: z.string().max(500, "Notes too long").optional(),
});

type MeterReadingFormValues = z.infer<typeof meterReadingFormSchema>;

interface RecordReadingButtonProps {
  meterId: string;
  meterName: string;
  meterUnit: string;
  currentReading: string | null;
}

export function RecordReadingButton({
  meterId,
  meterName,
  meterUnit,
  currentReading,
}: RecordReadingButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<MeterReadingFormValues>({
    resolver: zodResolver(meterReadingFormSchema),
    defaultValues: {
      reading: currentReading ? Number.parseFloat(currentReading) : 0,
      notes: "",
    },
  });

  async function onSubmit(values: MeterReadingFormValues) {
    setIsSubmitting(true);
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(`/api/equipment/meters/${meterId}/readings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken ?? "",
        },
        body: JSON.stringify({
          reading: values.reading,
          notes: values.notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to record reading");
      }

      toast({
        title: "Reading Recorded",
        description: `${meterName} updated to ${values.reading} ${meterUnit}`,
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to record reading",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Record Reading
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            Record Reading
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-zinc-500">
            Update {meterName} meter reading
          </DialogDescription>
        </DialogHeader>
        <div className="h-px bg-zinc-100 my-2" />

        <div className="bg-muted/50 rounded-lg p-3 mb-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Current Reading</span>
            <span className="font-bold">
              {currentReading || "—"} {meterUnit}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
            <FormField
              control={form.control}
              name="reading"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Reading</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        className="pr-16"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-zinc-400">
                        {meterUnit}
                      </div>
                    </div>
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
                  <FormLabel>
                    Notes{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any observations..."
                      className="resize-none"
                      rows={2}
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
                className="w-full h-14 rounded-2xl bg-primary-600 text-lg font-black uppercase tracking-widest shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
              >
                {isSubmitting ? "Saving..." : "Save Reading"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
