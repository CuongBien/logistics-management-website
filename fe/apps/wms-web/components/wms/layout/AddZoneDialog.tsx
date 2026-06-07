"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog"
import { Button } from "@repo/ui/components/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form"
import { createZone } from "@/lib/api/wms-layout"
import { ZoneType } from "@/types/wms-layout"
import { toast } from "sonner"

const formSchema = z.object({
  type: z.string().min(1, "Please select a zone type"),
})

export function AddZoneDialog({ blockId, open, onOpenChange, onCreated }: { blockId: string, open: boolean, onOpenChange: (open: boolean) => void, onCreated: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createZone(blockId, values.type as ZoneType)
      toast.success("Zone created successfully")
      onOpenChange(false)
      form.reset()
      onCreated()
    } catch (error) {
      toast.error("Failed to create zone")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Zone</DialogTitle>
          <DialogDescription>Create a new zone within the block.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Inbound">Inbound</SelectItem>
                      <SelectItem value="Storage">Storage</SelectItem>
                      <SelectItem value="Outbound">Outbound</SelectItem>
                      <SelectItem value="Return">Return</SelectItem>
                      <SelectItem value="CrossDock">CrossDock</SelectItem>
                      <SelectItem value="Staging">Staging</SelectItem>
                    </SelectContent>
                  </Select>
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
