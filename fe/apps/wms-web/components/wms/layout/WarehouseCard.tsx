"use client"

import Link from "next/link"
import { WarehouseDto } from "@/types/wms-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Building2, ArrowRight } from "lucide-react"
import { Button } from "@repo/ui/components/button"

interface WarehouseCardProps {
  warehouse: WarehouseDto
}

export function WarehouseCard({ warehouse }: WarehouseCardProps) {
  return (
    <Card className="hover:shadow-md transition-all duration-300 border-muted hover:border-primary/40 flex flex-col h-full bg-card/50 backdrop-blur-sm group relative overflow-hidden">
      {/* Sleek top gradient border */}
      <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-80" />
      
      <CardHeader className="flex flex-row items-center gap-4 pb-3">
        <div className="bg-primary/10 p-3 rounded-xl group-hover:scale-105 transition-transform duration-300">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">
            {warehouse.name}
          </CardTitle>
          <CardDescription className="font-mono text-xs text-muted-foreground mt-0.5 tracking-wider">
            {warehouse.code}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 justify-between gap-4 pt-0">
        <p className="text-sm text-muted-foreground">
          Quản lý cấu trúc vật lý bao gồm các dãy Block, khu vực Zone và các ô chứa Bin bên trong kho.
        </p>
        <Link href={`/wms/layout/${warehouse.id}`} className="w-full">
          <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 flex items-center justify-center gap-2">
            View Hierarchy
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
