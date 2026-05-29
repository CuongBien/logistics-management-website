"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { WarehouseHierarchyDto } from "@/types/wms-layout"
import { getWarehouseHierarchy } from "@/lib/api/wms-layout"
import { HierarchyTree } from "@/components/wms/layout/HierarchyTree"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WarehouseLayoutPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [hierarchy, setHierarchy] = useState<WarehouseHierarchyDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchHierarchy = async () => {
    setIsLoading(true)
    try {
      const data = await getWarehouseHierarchy(id)
      setHierarchy(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchHierarchy()
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hierarchy) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <p className="text-lg text-muted-foreground">Warehouse not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/wms/layout')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse: {hierarchy.name}</h1>
          <p className="text-muted-foreground font-mono">Code: {hierarchy.code}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-card rounded-lg border p-4">
        <HierarchyTree hierarchy={hierarchy} onRefresh={fetchHierarchy} />
      </div>
    </div>
  )
}
