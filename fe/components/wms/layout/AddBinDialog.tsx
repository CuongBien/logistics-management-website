"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createBin } from "@/lib/api/wms-layout"
import { toast } from "sonner"

const formSchema = z.object({
  binCode: z.string().min(2, "Bin Code must be at least 2 characters"),
})

export function AddBinDialog({ zoneId, warehouseId, open, onOpenChange, onCreated }: { zoneId: string, warehouseId: string, open: boolean, onOpenChange: (open: boolean) => void, onCreated: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { binCode: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createBin(zoneId, values.binCode, warehouseId)
      toast.success("Bin created successfully")
      onOpenChange(false)
      form.reset()
      onCreated()
    } catch (error) {
      toast.error("Failed to create bin")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Bin</DialogTitle>
          <DialogDescription>Create a new bin (shelf location) in this zone.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="binCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bin Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. A-01-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
