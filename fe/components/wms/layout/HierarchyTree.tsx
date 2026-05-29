"use client"

import { useState } from "react"
import { WarehouseHierarchyDto, BlockDto, ZoneDto, BinDto, BinStatus } from "@/types/wms-layout"
import { updateBinStatus } from "@/lib/api/wms-layout"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Box, Layers, Grid3X3, PackageOpen, Wrench, Lock } from "lucide-react"
import { AddBlockDialog } from "./AddBlockDialog"
import { AddZoneDialog } from "./AddZoneDialog"
import { AddBinDialog } from "./AddBinDialog"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const BinStatusBadge = ({ status }: { status: BinStatus }) => {
  switch (status) {
    case 'Available': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Available</Badge>;
    case 'Occupied': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Occupied</Badge>;
    case 'Full': return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Full</Badge>;
    case 'Maintenance': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Maintenance</Badge>;
    case 'Locked': return <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Locked</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export function HierarchyTree({ hierarchy, onRefresh }: { hierarchy: WarehouseHierarchyDto, onRefresh: () => void }) {
  const [addBlockOpen, setAddBlockOpen] = useState(false)
  const [addZoneOpen, setAddZoneOpen] = useState(false)
  const [addBinOpen, setAddBinOpen] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState("")
  const [selectedZoneId, setSelectedZoneId] = useState("")

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

  const handleUpdateBinStatus = async (binId: string, status: BinStatus) => {
    try {
      await updateBinStatus(binId, status)
      toast.success("Bin status updated")
      onRefresh()
    } catch (e) {
      toast.error("Failed to update status")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <BuildingIcon className="h-5 w-5" /> {hierarchy.name} Hierarchy
        </h3>
        <Button size="sm" onClick={() => setAddBlockOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Block
        </Button>
      </div>

      <Accordion type="multiple" className="w-full border rounded-lg overflow-hidden">
        {hierarchy.blocks.map((block) => (
          <AccordionItem key={block.id} value={block.id} className="border-b last:border-0 px-4">
            <div className="flex items-center justify-between w-full">
              <AccordionTrigger className="hover:no-underline flex-1">
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Block: {block.code}</span>
                  <Badge variant="secondary">{block.zones.length} Zones</Badge>
                </div>
              </AccordionTrigger>
              <Button size="sm" variant="ghost" onClick={(e) => openAddZone(e, block.id)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <AccordionContent className="pl-6 pt-2 pb-4 space-y-4 border-l-2 border-primary/20 ml-2">
              {block.zones.map((zone) => (
                <div key={zone.id} className="border rounded-md p-3 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Zone: {zone.type}</span>
                      <Badge variant="outline">{zone.bins.length} Bins</Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={(e) => openAddBin(e, zone.id)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Bin
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {zone.bins.map((bin) => (
                      <DropdownMenu key={bin.id}>
                        <DropdownMenuTrigger asChild>
                          <div className="flex flex-col p-2 border rounded bg-background hover:border-primary/50 cursor-pointer transition-colors text-center">
                            <span className="text-sm font-mono font-medium mb-1">{bin.binCode}</span>
                            <BinStatusBadge status={bin.status} />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleUpdateBinStatus(bin.id, 'Available')}>
                            <Grid3X3 className="mr-2 h-4 w-4" /> Set Available
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateBinStatus(bin.id, 'Maintenance')}>
                            <Wrench className="mr-2 h-4 w-4" /> Set Maintenance
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateBinStatus(bin.id, 'Locked')}>
                            <Lock className="mr-2 h-4 w-4" /> Lock Bin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}
                    {zone.bins.length === 0 && (
                      <div className="col-span-full text-xs text-muted-foreground p-2 text-center border border-dashed rounded">
                        No bins in this zone
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {block.zones.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No zones created in this block yet.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
        {hierarchy.blocks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No blocks defined. Start by adding a block.
          </div>
        )}
      </Accordion>

      <AddBlockDialog warehouseId={hierarchy.warehouseId} open={addBlockOpen} onOpenChange={setAddBlockOpen} onCreated={onRefresh} />
      <AddZoneDialog blockId={selectedBlockId} open={addZoneOpen} onOpenChange={setAddZoneOpen} onCreated={onRefresh} />
      <AddBinDialog zoneId={selectedZoneId} open={addBinOpen} onOpenChange={setAddBinOpen} onCreated={onRefresh} />
    </div>
  )
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  )
}
