"use client";

import { consumeWorkOrderPartAction } from "@/actions/inventory";
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

interface WorkOrderPart {
  id: number;
  part: Part;
  quantity: number;
  unitCost: number | null;
  addedBy: { name: string };
  addedAt: Date;
}

interface WorkOrderPartsManagerProps {
  workOrderId: number;
  parts: WorkOrderPart[]; // Consumed parts
  allParts: Part[]; // Catalog
  locations: Location[];
}

const consumeSchema = z.object({
  partId: z.string().min(1, "Part is required"),
  locationId: z.string().min(1, "Location is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

export function WorkOrderPartsManager({
  workOrderId,
  parts,
  allParts,
  locations,
}: WorkOrderPartsManagerProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof consumeSchema>>({
    resolver: zodResolver(consumeSchema),
    defaultValues: {
      partId: "",
      locationId: "",
      quantity: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof consumeSchema>) {
    try {
      const result = await consumeWorkOrderPartAction({
        workOrderId,
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
    <div className="rounded-2xl border-2 bg-white overflow-hidden shadow-sm">
      <div className="bg-zinc-50 px-4 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-zinc-400" />
          <h3 className="font-black text-xs uppercase tracking-widest text-zinc-900">
            Parts & Materials
          </h3>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 rounded-lg border-2 font-black uppercase tracking-tighter text-[10px] gap-1.5 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Log Part
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                Consume Part
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-zinc-500">
                Record parts used for this work order. Stock will be deducted
                automatically from the selected location.
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
                  name="partId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                        Part Selection
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-2 bg-zinc-50 font-bold focus:ring-primary-500/10">
                            <SelectValue placeholder="Select a part" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2 shadow-xl">
                          {allParts.map((part) => (
                            <SelectItem
                              key={part.id}
                              value={part.id.toString()}
                              className="py-3 font-medium"
                            >
                              {part.name}{" "}
                              <span className="text-[10px] font-mono opacity-50 ml-1">
                                ({part.sku})
                              </span>
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                        Source Location
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl border-2 bg-zinc-50 font-bold focus:ring-primary-500/10">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-2 shadow-xl">
                          {locations.map((loc) => (
                            <SelectItem
                              key={loc.id}
                              value={loc.id.toString()}
                              className="py-3 font-medium"
                            >
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                        Quantity Used
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            className="h-12 rounded-xl border-2 bg-zinc-50 font-black text-lg focus:ring-primary-500/10 pl-4 pr-12"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-zinc-400">
                            UNITS
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-primary-600 text-lg font-black uppercase tracking-widest shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                  >
                    Register usage
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 space-y-4">
        {parts.length === 0 ? (
          <div className="py-8 text-center bg-zinc-50 rounded-xl border-2 border-dashed">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              No parts registered
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {parts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border-2 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-zinc-50 border-2 flex items-center justify-center text-zinc-400 shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-zinc-900 truncate uppercase mt-0.5">
                      {p.part.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                      <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">
                        {p.quantity} UNITS
                      </span>
                      {p.unitCost && <span>• ${p.unitCost.toFixed(2)} ea</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-sm text-zinc-900 leading-none">
                    $
                    {((p.unitCost || 0) * p.quantity).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}
                  </p>
                  <p className="mt-1 text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                    By {p.addedBy.name.split(" ")[0]}
                  </p>
                </div>
              </div>
            ))}
            <div className="pt-4 mt-2 border-t-2 border-zinc-100 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Total Materials
              </span>
              <span className="text-lg font-black text-zinc-900">
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
