"use client";

import { createVendor, updateVendor } from "@/actions/vendors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { Vendor } from "@/db/schema";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VendorForm({ vendor }: { vendor?: Vendor }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      const data = {
        name: formData.get("name") as string,
        code: formData.get("code") as string,
        contactPerson: formData.get("contactPerson") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        website: formData.get("website") as string,
        address: formData.get("address") as string,
        notes: formData.get("notes") as string,
      };

      if (vendor) {
        await updateVendor(vendor.id, data);
        toast({ title: "Vendor updated successfully" });
      } else {
        await createVendor(data);
        toast({ title: "Vendor created successfully" });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{vendor ? "Edit Vendor" : "New Vendor"}</CardTitle>
        <CardDescription>
          Manage supplier details for parts and services.
        </CardDescription>
      </CardHeader>
      <form action={onSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={vendor?.name}
                required
                placeholder="Acme Industrial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Vendor Code *</Label>
              <Input
                id="code"
                name="code"
                defaultValue={vendor?.code}
                required
                placeholder="ACME-01"
                className="font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                defaultValue={vendor?.contactPerson || ""}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={vendor?.phone || ""}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={vendor?.email || ""}
              placeholder="orders@acme.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={vendor?.website || ""}
              placeholder="https://acme.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={vendor?.address || ""}
              placeholder="123 Industrial Pkwy..."
              className="resize-none min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={vendor?.notes || ""}
              placeholder="Payment terms, special instructions..."
              className="resize-none min-h-[80px]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : vendor
                ? "Save Changes"
                : "Create Vendor"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
