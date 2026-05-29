"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createBlock } from "@/lib/api/wms-layout"
import { toast } from "sonner"

const formSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").max(20),
})

export function AddBlockDialog({ warehouseId, open, onOpenChange, onCreated }: { warehouseId: string, open: boolean, onOpenChange: (open: boolean) => void, onCreated: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createBlock(warehouseId, values.code)
      toast.success("Block created successfully")
      onOpenChange(false)
      form.reset()
      onCreated()
    } catch (error) {
      toast.error("Failed to create block")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
          <DialogDescription>Create a new block in this warehouse.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Block Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. BLK-A" {...field} />
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
