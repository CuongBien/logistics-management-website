"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { createWarehouse } from "@/lib/api/wms-layout"
import { toast } from "sonner"
import { Plus } from "lucide-react"

const formSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").max(20),
  name: z.string().min(2, "Name must be at least 2 characters"),
})

export function WarehouseFormDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createWarehouse(values)
      toast.success("Warehouse created successfully")
      setOpen(false)
      form.reset()
      onCreated()
    } catch (error) {
      toast.error("Failed to create warehouse")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Add Warehouse</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Warehouse</DialogTitle>
          <DialogDescription>
            Add a new physical warehouse to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ATL-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Atlanta Main Hub" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
