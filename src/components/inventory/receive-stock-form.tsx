"use client";

import { createTransactionAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

// We can reuse schema or refine it for form specific needs if different.
// For now let's use a local definition that maps to the action schema for better form control
// or just import the type?
// Let's redefine local form schema to match UI needs, then map to action.
const formSchema = z.object({
  partId: z.coerce.number().min(1, "Part is required"),
  locationId: z.coerce.number().min(1, "Location is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

interface ReceiveStockFormProps {
  parts: { id: number; name: string; sku: string }[];
  locations: { id: number; name: string }[];
}

export function ReceiveStockForm({ parts, locations }: ReceiveStockFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      reference: "",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await createTransactionAction({
        ...values,
        type: "in",
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit transaction");
      }

      toast({
        title: "Stock Received",
        description: "Inventory has been updated successfully.",
      });

      // No need to manual push/refresh if action revalidates, but for client nav stick to it?
      // Action revalidates, but router.refresh ensures client cache is updated if needed.
      // Actually standard pattern is just router.push if redirecting.
      router.push("/assets/inventory");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="partId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a part" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parts.map((part) => (
                      <SelectItem key={part.id} value={part.id.toString()}>
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
                <FormLabel>Location</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
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
        </div>

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

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="PO #, Invoice #, etc." {...field} />
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional details..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">Receive Stock</Button>
        </div>
      </form>
    </Form>
  );
}
