"use client"

import { useState } from "react"
import { Search, Boxes, Lock, Unlock, Zap, ClipboardCheck } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { toast } from "sonner"
import * as inventoryService from "@/lib/services/inventory"
import type { InventoryLedger } from "@/lib/types"

export default function InventoryPage() {
  const [ledgerId, setLedgerId] = useState("")
  const [ledger, setLedger] = useState<InventoryLedger[]>([])
  const [ledgerLoading, setLedgerLoading] = useState(false)
  const [ledgerError, setLedgerError] = useState<string|null>(null)
  const [reserveForm, setReserveForm] = useState({ warehouseId:"", sku:"SKU001", quantity:"10", referenceId:"ORD-123", referenceType:"1", correlationId:"" })
  const [releaseForm, setReleaseForm] = useState({ warehouseId:"", reservationId:"" })
  const [consumeForm, setConsumeForm] = useState({ warehouseId:"", reservationId:"" })
  const [reconcileWh, setReconcileWh] = useState("")

  const searchLedger = async () => {
    if (!ledgerId.trim()) return
    setLedgerLoading(true); setLedgerError(null)
    try {
      const r = await inventoryService.getLedger(ledgerId.trim())
      if (r.isSuccess && r.value) setLedger(r.value)
      else { setLedgerError(r.error?.message || "Not found"); setLedger([]) }
    } catch (e) { setLedgerError(e instanceof Error ? e.message : "Failed"); setLedger([]) }
    finally { setLedgerLoading(false) }
  }

  const handleReserve = async () => {
    try {
      const r = await inventoryService.reserveStock({ warehouseId: reserveForm.warehouseId, sku: reserveForm.sku, quantity: parseInt(reserveForm.quantity), referenceId: reserveForm.referenceId, referenceType: parseInt(reserveForm.referenceType) || 1, correlationId: reserveForm.correlationId || undefined })
      r.isSuccess ? toast.success(`Reserved! ID: ${r.value}`) : toast.error(r.error?.message || "Failed")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleRelease = async () => {
    try {
      const r = await inventoryService.releaseStock({ warehouseId: releaseForm.warehouseId, reservationId: releaseForm.reservationId })
      r.isSuccess ? toast.success("Stock released") : toast.error(r.error?.message || "Failed")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleConsume = async () => {
    try {
      const r = await inventoryService.consumeStock({ warehouseId: consumeForm.warehouseId, reservationId: consumeForm.reservationId })
      r.isSuccess ? toast.success("Stock consumed") : toast.error(r.error?.message || "Failed")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleReconcile = async () => {
    try {
      const r = await inventoryService.reconcileInventory({ warehouseId: reconcileWh || null })
      r.isSuccess ? toast.success("Reconciliation complete") : toast.error(r.error?.message || "Failed")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted border-b border-border px-4 py-2">
        <h1 className="text-sm font-semibold flex items-center gap-2"><Boxes className="h-4 w-4" /> Inventory Management</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="ledger" className="space-y-4">
          <TabsList className="h-8">
            <TabsTrigger value="ledger" className="text-xs h-7">Ledger Viewer</TabsTrigger>
            <TabsTrigger value="operations" className="text-xs h-7">Stock Operations</TabsTrigger>
            <TabsTrigger value="reconcile" className="text-xs h-7">Reconciliation</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger" className="space-y-4">
            <div className="flex gap-2 max-w-xl">
              <Input placeholder="Inventory Item ID" className="h-9 text-sm font-mono" value={ledgerId} onChange={e=>setLedgerId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchLedger()} />
              <Button onClick={searchLedger} disabled={ledgerLoading} className="h-9 px-4 bg-[#C41E3A] hover:bg-[#A01830] text-white text-xs"><Search className="h-3.5 w-3.5 mr-1" />Search</Button>
            </div>
            {ledgerError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs">{ledgerError}</div>}
            {ledger.length > 0 && (
              <div className="border border-border bg-white">
                <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase">Inventory Ledger</h3>
                  <span className="text-[10px] text-muted-foreground">{ledger.length} entries</span>
                </div>
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/80">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase h-8">Reason</TableHead>
                        <TableHead className="text-[10px] uppercase h-8 text-right">Qty Change</TableHead>
                        <TableHead className="text-[10px] uppercase h-8 text-right">Balance After</TableHead>
                        <TableHead className="text-[10px] uppercase h-8">Reference</TableHead>
                        <TableHead className="text-[10px] uppercase h-8">Operator</TableHead>
                        <TableHead className="text-[10px] uppercase h-8">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledger.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs py-2"><span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 text-[10px] font-medium">{l.reason}</span></TableCell>
                          <TableCell className={`text-xs py-2 text-right font-mono font-semibold ${l.quantityChange>0?"text-green-600":l.quantityChange<0?"text-red-600":""}`}>{l.quantityChange > 0 ? "+" : ""}{l.quantityChange}</TableCell>
                          <TableCell className="text-xs py-2 text-right font-mono">{l.balanceAfter}</TableCell>
                          <TableCell className="text-xs py-2 font-mono text-[10px]">{l.referenceId || "—"}</TableCell>
                          <TableCell className="text-xs py-2 font-mono text-[10px]">{l.operatorSub || "System"}</TableCell>
                          <TableCell className="text-xs py-2">{new Date(l.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="operations">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Reserve */}
              <div className="border border-border bg-white">
                <div className="bg-blue-600 text-white px-3 py-1.5 flex items-center gap-2"><Lock className="h-3.5 w-3.5" /><h3 className="text-xs font-semibold uppercase">Reserve Stock</h3></div>
                <div className="p-3 space-y-2">
                  <div><Label className="text-xs">Warehouse ID</Label><Input className="h-7 text-xs mt-1 font-mono" value={reserveForm.warehouseId} onChange={e=>setReserveForm({...reserveForm,warehouseId:e.target.value})} /></div>
                  <div><Label className="text-xs">SKU</Label><Input className="h-7 text-xs mt-1" value={reserveForm.sku} onChange={e=>setReserveForm({...reserveForm,sku:e.target.value})} /></div>
                  <div><Label className="text-xs">Quantity</Label><Input className="h-7 text-xs mt-1" type="number" value={reserveForm.quantity} onChange={e=>setReserveForm({...reserveForm,quantity:e.target.value})} /></div>
                  <div><Label className="text-xs">Reference ID</Label><Input className="h-7 text-xs mt-1" value={reserveForm.referenceId} onChange={e=>setReserveForm({...reserveForm,referenceId:e.target.value})} /></div>
                  <div><Label className="text-xs">Correlation ID</Label><Input className="h-7 text-xs mt-1 font-mono" placeholder="optional" value={reserveForm.correlationId} onChange={e=>setReserveForm({...reserveForm,correlationId:e.target.value})} /></div>
                  <Button className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={handleReserve}><Lock className="h-3 w-3 mr-1" />Reserve</Button>
                </div>
              </div>
              {/* Release */}
              <div className="border border-border bg-white">
                <div className="bg-amber-600 text-white px-3 py-1.5 flex items-center gap-2"><Unlock className="h-3.5 w-3.5" /><h3 className="text-xs font-semibold uppercase">Release Stock</h3></div>
                <div className="p-3 space-y-2">
                  <div><Label className="text-xs">Warehouse ID</Label><Input className="h-7 text-xs mt-1 font-mono" value={releaseForm.warehouseId} onChange={e=>setReleaseForm({...releaseForm,warehouseId:e.target.value})} /></div>
                  <div><Label className="text-xs">Reservation ID</Label><Input className="h-7 text-xs mt-1 font-mono" value={releaseForm.reservationId} onChange={e=>setReleaseForm({...releaseForm,reservationId:e.target.value})} /></div>
                  <Button className="w-full h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={handleRelease}><Unlock className="h-3 w-3 mr-1" />Release</Button>
                </div>
              </div>
              {/* Consume */}
              <div className="border border-border bg-white">
                <div className="bg-green-600 text-white px-3 py-1.5 flex items-center gap-2"><Zap className="h-3.5 w-3.5" /><h3 className="text-xs font-semibold uppercase">Consume Stock</h3></div>
                <div className="p-3 space-y-2">
                  <div><Label className="text-xs">Warehouse ID</Label><Input className="h-7 text-xs mt-1 font-mono" value={consumeForm.warehouseId} onChange={e=>setConsumeForm({...consumeForm,warehouseId:e.target.value})} /></div>
                  <div><Label className="text-xs">Reservation ID</Label><Input className="h-7 text-xs mt-1 font-mono" value={consumeForm.reservationId} onChange={e=>setConsumeForm({...consumeForm,reservationId:e.target.value})} /></div>
                  <Button className="w-full h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={handleConsume}><Zap className="h-3 w-3 mr-1" />Consume</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reconcile">
            <div className="border border-border bg-white max-w-md">
              <div className="bg-muted px-3 py-1.5 border-b border-border"><h3 className="text-xs font-semibold uppercase">Inventory Reconciliation</h3></div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground">Phát hiện sai lệch giữa Snapshot và Ledger. Để trống Warehouse ID để quét toàn bộ.</p>
                <div><Label className="text-xs">Warehouse ID (optional)</Label><Input className="h-8 text-xs mt-1 font-mono" value={reconcileWh} onChange={e=>setReconcileWh(e.target.value)} /></div>
                <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleReconcile}><ClipboardCheck className="h-3 w-3 mr-1" />Run Reconciliation</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
