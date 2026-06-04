"use client"

import { useState, useEffect } from "react"
import { Warehouse as WarehouseIcon, Plus, ChevronRight, ChevronDown, Box, Grid3X3, Layers } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog"
import { toast } from "sonner"
import * as warehouseService from "@/lib/services/warehouse"
import type { WarehouseEntity, Block, Zone, Bin } from "@/lib/types"

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<WarehouseEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWh, setSelectedWh] = useState<WarehouseEntity|null>(null)
  const [hierarchy, setHierarchy] = useState<WarehouseEntity|null>(null)
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set())

  // Create forms
  const [whForm, setWhForm] = useState({ name:"", code:"", locationText:"" })
  const [blockForm, setBlockForm] = useState({ warehouseId:"", blockCode:"" })
  const [zoneForm, setZoneForm] = useState({ blockId:"", zoneType:"0" })
  const [binForm, setBinForm] = useState({ zoneId:"", warehouseId:"", binCode:"" })
  const [createWhOpen, setCreateWhOpen] = useState(false)
  const [createBlockOpen, setCreateBlockOpen] = useState(false)
  const [createZoneOpen, setCreateZoneOpen] = useState(false)
  const [createBinOpen, setCreateBinOpen] = useState(false)

  const loadWarehouses = async () => {
    setLoading(true)
    try { setWarehouses(await warehouseService.getWarehouses()) }
    catch { toast.error("Failed to load warehouses") }
    finally { setLoading(false) }
  }

  const loadHierarchy = async (id: string) => {
    try {
      const h = await warehouseService.getWarehouseHierarchy(id)
      setHierarchy(h)
      setSelectedWh(warehouses.find(w=>w.id===id)||null)
    } catch { toast.error("Failed to load hierarchy") }
  }

  useEffect(() => { loadWarehouses() }, [])

  const toggleBlock = (id: string) => { const s = new Set(expandedBlocks); s.has(id)?s.delete(id):s.add(id); setExpandedBlocks(s) }
  const toggleZone = (id: string) => { const s = new Set(expandedZones); s.has(id)?s.delete(id):s.add(id); setExpandedZones(s) }

  const handleCreateWh = async () => {
    try {
      const r = await warehouseService.createWarehouse(whForm)
      toast.success(`Warehouse created: ${r}`)
      setCreateWhOpen(false); loadWarehouses()
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleCreateBlock = async () => {
    try {
      const r = await warehouseService.createBlock(blockForm.warehouseId, blockForm.blockCode)
      toast.success(`Block created: ${r}`)
      setCreateBlockOpen(false); if(selectedWh) loadHierarchy(selectedWh.id)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleCreateZone = async () => {
    try {
      const r = await warehouseService.createZone(zoneForm.blockId, parseInt(zoneForm.zoneType) as any)
      toast.success(`Zone created: ${r}`)
      setCreateZoneOpen(false); if(selectedWh) loadHierarchy(selectedWh.id)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleCreateBin = async () => {
    try {
      const r = await warehouseService.createBin(binForm.zoneId, { warehouseId: binForm.warehouseId, binCode: binForm.binCode })
      toast.success(`Bin created: ${r}`)
      setCreateBinOpen(false); if(selectedWh) loadHierarchy(selectedWh.id)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const zoneTypeNames: Record<number,string> = { 0:"Receiving", 1:"Storage", 2:"Shipping", 3:"Returns" }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted border-b border-border px-4 py-2 flex items-center justify-between">
        <h1 className="text-sm font-semibold flex items-center gap-2"><WarehouseIcon className="h-4 w-4" /> Warehouse Layout</h1>
        <div className="flex gap-2">
          <Dialog open={createWhOpen} onOpenChange={setCreateWhOpen}>
            <DialogTrigger asChild><Button size="sm" className="h-7 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white"><Plus className="h-3 w-3 mr-1" />Warehouse</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="text-sm">Create Warehouse</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Name</Label><Input className="h-8 text-xs mt-1" value={whForm.name} onChange={e=>setWhForm({...whForm,name:e.target.value})} /></div>
                <div><Label className="text-xs">Code</Label><Input className="h-8 text-xs mt-1" value={whForm.code} onChange={e=>setWhForm({...whForm,code:e.target.value})} /></div>
                <div><Label className="text-xs">Location</Label><Input className="h-8 text-xs mt-1" value={whForm.locationText} onChange={e=>setWhForm({...whForm,locationText:e.target.value})} /></div>
                <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleCreateWh}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={createBlockOpen} onOpenChange={setCreateBlockOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Block</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="text-sm">Create Block</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Warehouse ID</Label><Input className="h-8 text-xs mt-1 font-mono" value={blockForm.warehouseId} onChange={e=>setBlockForm({...blockForm,warehouseId:e.target.value})} /></div>
                <div><Label className="text-xs">Block Code</Label><Input className="h-8 text-xs mt-1" value={blockForm.blockCode} onChange={e=>setBlockForm({...blockForm,blockCode:e.target.value})} /></div>
                <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleCreateBlock}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={createZoneOpen} onOpenChange={setCreateZoneOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Zone</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="text-sm">Create Zone</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Block ID</Label><Input className="h-8 text-xs mt-1 font-mono" value={zoneForm.blockId} onChange={e=>setZoneForm({...zoneForm,blockId:e.target.value})} /></div>
                <div><Label className="text-xs">Zone Type</Label>
                  <select className="w-full h-8 text-xs mt-1 border border-border bg-white px-2" value={zoneForm.zoneType} onChange={e=>setZoneForm({...zoneForm,zoneType:e.target.value})}>
                    <option value="0">Receiving</option><option value="1">Storage</option><option value="2">Shipping</option><option value="3">Returns</option>
                  </select>
                </div>
                <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleCreateZone}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={createBinOpen} onOpenChange={setCreateBinOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Bin</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle className="text-sm">Create Bin</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Zone ID</Label><Input className="h-8 text-xs mt-1 font-mono" value={binForm.zoneId} onChange={e=>setBinForm({...binForm,zoneId:e.target.value})} /></div>
                <div><Label className="text-xs">Warehouse ID</Label><Input className="h-8 text-xs mt-1 font-mono" value={binForm.warehouseId} onChange={e=>setBinForm({...binForm,warehouseId:e.target.value})} /></div>
                <div><Label className="text-xs">Bin Code</Label><Input className="h-8 text-xs mt-1" value={binForm.binCode} onChange={e=>setBinForm({...binForm,binCode:e.target.value})} /></div>
                <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleCreateBin}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Warehouse List */}
          <div className="border border-border bg-white">
            <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase">Warehouses</h3>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={loadWarehouses}>Refresh</Button>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {warehouses.map(w => (
                <button key={w.id} className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${selectedWh?.id===w.id?"bg-[#C41E3A]/5 border-l-2 border-[#C41E3A]":""}`} onClick={()=>loadHierarchy(w.id)}>
                  <div className="flex items-center gap-2">
                    <WarehouseIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{w.name}</div>
                      <div className="text-[10px] text-muted-foreground flex gap-2">
                        <span className="font-mono">{w.code}</span>
                        <span>•</span>
                        <span>{w.locationText}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {warehouses.length===0 && <div className="text-center text-xs text-muted-foreground py-8">No warehouses found</div>}
            </div>
          </div>

          {/* Hierarchy Tree */}
          <div className="lg:col-span-2 border border-border bg-white">
            <div className="bg-muted px-3 py-1.5 border-b border-border">
              <h3 className="text-xs font-semibold uppercase">{selectedWh ? `Hierarchy: ${selectedWh.name}` : "Select a warehouse"}</h3>
            </div>
            <div className="p-3 max-h-[500px] overflow-y-auto">
              {!hierarchy ? (
                <div className="text-center text-xs text-muted-foreground py-12">Click a warehouse to view its hierarchy</div>
              ) : (
                <div className="space-y-1">
                  {(hierarchy.blocks as Block[] || []).map(block => (
                    <div key={block.id} className="ml-0">
                      <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 hover:bg-muted/50 text-xs" onClick={()=>toggleBlock(block.id)}>
                        {expandedBlocks.has(block.id)?<ChevronDown className="h-3 w-3" />:<ChevronRight className="h-3 w-3" />}
                        <Grid3X3 className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-medium">{block.blockCode}</span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-1">{block.id.slice(0,8)}</span>
                      </button>
                      {expandedBlocks.has(block.id) && (block.zones||[]).map(zone => (
                        <div key={zone.id} className="ml-6">
                          <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 hover:bg-muted/50 text-xs" onClick={()=>toggleZone(zone.id)}>
                            {expandedZones.has(zone.id)?<ChevronDown className="h-3 w-3" />:<ChevronRight className="h-3 w-3" />}
                            <Layers className="h-3.5 w-3.5 text-purple-500" />
                            <span className="font-medium">{zone.zoneCode || zoneTypeNames[zone.zoneType] || `Zone-${zone.zoneType}`}</span>
                            <span className="bg-purple-50 text-purple-700 text-[9px] px-1.5 py-0.5 font-medium">{zoneTypeNames[zone.zoneType]}</span>
                          </button>
                          {expandedZones.has(zone.id) && (zone.bins||[]).map(bin => (
                            <div key={bin.id} className="ml-12 flex items-center gap-2 px-2 py-1 text-xs">
                              <Box className={`h-3 w-3 ${bin.isOccupied?"text-red-500":"text-green-500"}`} />
                              <span className="font-mono">{bin.binCode}</span>
                              {bin.isOccupied && <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5">Occupied</span>}
                              {bin.currentOrderId && <span className="text-[9px] text-blue-600 font-mono">{bin.currentOrderId.slice(0,8)}...</span>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                  {(hierarchy.blocks as Block[] || []).length===0 && <div className="text-center text-xs text-muted-foreground py-8">No blocks in this warehouse</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
