"use client";

import { consumeTicketPartAction } from "@/actions/inventory";
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
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface Part {
  id: number;
  name: string;
  sku: string;
}

interface Location {
  id: number;
  name: string;
}

interface TicketPart {
  id: number;
  part: Part;
  quantity: number;
  unitCost: number | null;
  addedBy: { name: string };
  addedAt: Date;
}

interface TicketPartsManagerProps {
  ticketId: number;
  parts: TicketPart[]; // Consumed parts
  allParts: Part[]; // Catalog
  locations: Location[];
}

const consumeSchema = z.object({
  partId: z.string().min(1, "Part is required"),
  locationId: z.string().min(1, "Location is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

export function TicketPartsManager({
  ticketId,
  parts,
  allParts,
  locations,
}: TicketPartsManagerProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof consumeSchema>>({
    resolver: zodResolver(consumeSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof consumeSchema>) {
    try {
      const result = await consumeTicketPartAction({
        ticketId,
        partId: Number.parseInt(values.partId),
        locationId: Number.parseInt(values.locationId),
        quantity: values.quantity,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to add part");
      }

      toast({
        title: "Part Added",
        description: "Inventory has been updated.",
      });
      setOpen(false);
      form.reset();
      // No need to manually refresh if action revalidates path
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add part",
      });
    }
  }

  const totalCost = parts.reduce(
    (sum, p) => sum + (p.unitCost || 0) * p.quantity,
    0
  );

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Parts & Materials
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Add Part
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Consume Part</DialogTitle>
              <DialogDescription>
                Record parts used for this ticket. Stock will be deducted
                automatically.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 py-4"
              >
                <FormField
                  control={form.control}
                  name="partId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a part" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allParts.map((part) => (
                            <SelectItem
                              key={part.id}
                              value={part.id.toString()}
                            >
                              {part.name} ({part.sku})
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
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Location</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id.toString()}>
                              {loc.name}
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
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">Add Part</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 space-y-4">
        {parts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No parts used yet.
          </p>
        ) : (
          <div className="space-y-3">
            {parts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{p.part.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.quantity} x{" "}
                      {p.unitCost ? `$${p.unitCost.toFixed(2)}` : "No Cost"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    $
                    {((p.unitCost || 0) * p.quantity).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Author: {p.addedBy.name}
                  </p>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t flex justify-between items-center font-bold">
              <span>Total Cost</span>
              <span>
                $
                {totalCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
