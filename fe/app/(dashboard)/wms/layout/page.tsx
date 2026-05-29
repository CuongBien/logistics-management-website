"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { WarehouseDto } from "@/types/wms-layout"
import { getWarehouses } from "@/lib/api/wms-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { WarehouseFormDialog } from "@/components/wms/layout/WarehouseFormDialog"
import { Loader2, Building2 } from "lucide-react"

export default function WarehouseListPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchWarehouses = async () => {
    setIsLoading(true)
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse Layout Management</h1>
          <p className="text-muted-foreground">Manage physical structure of warehouses, blocks, zones, and bins.</p>
        </div>
        <WarehouseFormDialog onCreated={fetchWarehouses} />
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <Link key={wh.id} href={`/wms/layout/${wh.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{wh.name}</CardTitle>
                    <CardDescription className="font-mono mt-1">{wh.code}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Click to manage blocks, zones, and bins inside this warehouse.</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {warehouses.length === 0 && (
            <div className="col-span-full p-8 text-center border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No warehouses found.</p>
              <WarehouseFormDialog onCreated={fetchWarehouses} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
