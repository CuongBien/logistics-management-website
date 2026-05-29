"use client"

import { useState } from "react"
import { WarehouseHierarchyDto, BinDto } from "@/types/wms-layout"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Box, Layers, Warehouse, HelpCircle } from "lucide-react"
import { AddBlockDialog } from "./AddBlockDialog"
import { AddZoneDialog } from "./AddZoneDialog"
import { AddBinDialog } from "./AddBinDialog"
import { BinStatusBadge } from "./BinStatusBadge"
import { EditBinStatusDialog } from "./EditBinStatusDialog"

export function HierarchyTree({ hierarchy, onRefresh }: { hierarchy: WarehouseHierarchyDto, onRefresh: () => void }) {
  const [addBlockOpen, setAddBlockOpen] = useState(false)
  const [addZoneOpen, setAddZoneOpen] = useState(false)
  const [addBinOpen, setAddBinOpen] = useState(false)
  const [editBinOpen, setEditBinOpen] = useState(false)
  
  const [selectedBlockId, setSelectedBlockId] = useState("")
  const [selectedZoneId, setSelectedZoneId] = useState("")
  const [selectedBin, setSelectedBin] = useState<BinDto | null>(null)

  const openAddZone = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation()
    setSelectedBlockId(blockId)
    setAddZoneOpen(true)
  }

  const openAddBin = (e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation()
    setSelectedZoneId(zoneId)
    setAddBinOpen(true)
  }

  const openEditBin = (bin: BinDto) => {
    setSelectedBin(bin)
    setEditBinOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between border-b pb-4 bg-muted/20 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              Sơ Đồ Phân Cấp Kho: {hierarchy.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click vào Block/Zone để xem chi tiết, và click vào ô Bin để thay đổi trạng thái kệ.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddBlockOpen(true)} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-medium shadow-sm transition-all duration-300">
          <Plus className="mr-2 h-4 w-4" /> Thêm Block
        </Button>
      </div>

      {/* Hierarchy Tree Accordion */}
      <Accordion type="multiple" className="w-full border rounded-xl overflow-hidden shadow-sm bg-card">
        {hierarchy.blocks.map((block) => (
          <AccordionItem key={block.id} value={block.id} className="border-b last:border-0 px-4 hover:bg-muted/5 transition-colors">
            <div className="flex items-center justify-between w-full">
              <AccordionTrigger className="hover:no-underline flex-1 py-4">
                <div className="flex items-center gap-3">
                  <Box className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-base">Dãy: {block.code}</span>
                  <Badge variant="secondary" className="font-medium text-xs rounded-full px-2 py-0.5">
                    {block.zones.length} Khu vực (Zone)
                  </Badge>
                </div>
              </AccordionTrigger>
              <Button size="sm" variant="ghost" onClick={(e) => openAddZone(e, block.id)} className="h-8 px-2 hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-1">
                <Plus className="h-4 w-4" />
                <span className="text-xs font-semibold hidden sm:inline">Khu vực</span>
              </Button>
            </div>

            <AccordionContent className="pl-6 pt-2 pb-5 space-y-4 border-l-2 border-primary/20 ml-2">
              {block.zones.map((zone) => (
                <div key={zone.id} className="border border-muted rounded-xl p-4 bg-muted/20 hover:border-primary/25 transition-all duration-300">
                  {/* Zone Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-muted/50 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-sm">Phân Khu: {zone.type}</span>
                      <Badge variant="outline" className="font-mono text-xs bg-background/50">
                        {zone.bins.length} Ô kệ (Bin)
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={(e) => openAddBin(e, zone.id)} className="h-8 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
                      <Plus className="mr-1 h-3.5 w-3.5" /> Thêm Ô Kệ
                    </Button>
                  </div>
                  
                  {/* Bins Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {zone.bins.map((bin) => (
                      <div
                        key={bin.id}
                        onClick={() => openEditBin(bin)}
                        className="flex flex-col p-3 border border-muted/60 rounded-xl bg-background hover:border-primary hover:shadow-sm cursor-pointer transition-all duration-300 text-center group relative overflow-hidden"
                      >
                        {/* Hover accent line */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                        <span className="text-xs font-semibold font-mono mb-2 group-hover:text-primary transition-colors">
                          {bin.binCode}
                        </span>
                        <BinStatusBadge status={bin.status} />
                      </div>
                    ))}
                    
                    {zone.bins.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-background/50 text-muted-foreground">
                        <HelpCircle className="h-6 w-6 mb-1 text-muted-foreground/60" />
                        <span className="text-xs">Chưa có ô kệ nào trong khu vực này</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {block.zones.length === 0 && (
                <div className="p-4 border border-dashed rounded-xl text-center bg-muted/10 text-muted-foreground text-sm">
                  Chưa có khu vực (Zone) nào được định nghĩa trong dãy này.
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}

        {hierarchy.blocks.length === 0 && (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/10">
            <Box className="h-10 w-10 text-muted-foreground/45 mb-2" />
            <p className="font-medium text-sm">Sơ đồ kho chưa được định cấu trúc vật lý.</p>
            <Button size="sm" onClick={() => setAddBlockOpen(true)} className="mt-4">
              Khởi tạo Block Đầu Tiên
            </Button>
          </div>
        )}
      </Accordion>

      {/* Action Dialogs */}
      <AddBlockDialog warehouseId={hierarchy.warehouseId} open={addBlockOpen} onOpenChange={setAddBlockOpen} onCreated={onRefresh} />
      <AddZoneDialog blockId={selectedBlockId} open={addZoneOpen} onOpenChange={setAddZoneOpen} onCreated={onRefresh} />
      <AddBinDialog zoneId={selectedZoneId} open={addBinOpen} onOpenChange={setAddBinOpen} onCreated={onRefresh} />
      <EditBinStatusDialog bin={selectedBin} open={editBinOpen} onOpenChange={setEditBinOpen} onUpdated={onRefresh} />
    </div>
  )
}
