"use client"

import { useState } from "react"
import { Search, Plus, PackageOpen, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { toast } from "sonner"
import * as inboundService from "@/lib/services/inbound"
import type { InboundReceipt } from "@/lib/types"

const statusColors: Record<string, string> = {
  Pending: "bg-blue-500 text-white", PartiallyReceived: "bg-amber-500 text-white",
  Received: "bg-green-500 text-white", Closed: "bg-gray-600 text-white",
  Cancelled: "bg-red-500 text-white", CompletedWithExceptions: "bg-orange-500 text-white",
}

export default function InboundPage() {
  const [searchOrderId, setSearchOrderId] = useState("")
  const [searchWarehouseId, setSearchWarehouseId] = useState("")
  const [receipt, setReceipt] = useState<InboundReceipt | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({ orderId: "", warehouseId: "", sourceShipmentNo: "", skuCode: "SKU-RED-TSHIRT", expectedQuantity: "10" })
  const [receiveForm, setReceiveForm] = useState({ receiptId: "", orderId: "", skuCode: "SKU-RED-TSHIRT", binCode: "BIN-C1-01", quantity: "5" })

  const searchReceipt = async () => {
    if (!searchOrderId.trim()) return
    setSearchLoading(true); setSearchError(null)
    try {
      setReceipt(await inboundService.getReceiptByOrderId(searchOrderId.trim(), searchWarehouseId.trim() || undefined))
    } catch (e) { setSearchError(e instanceof Error ? e.message : "Not found"); setReceipt(null) }
    finally { setSearchLoading(false) }
  }

  const handleCreate = async () => {
    try {
      const r = await inboundService.createReceipt({ orderId: createForm.orderId, warehouseId: createForm.warehouseId, sourceShipmentNo: createForm.sourceShipmentNo || undefined, expectedLines: [{ skuCode: createForm.skuCode, expectedQuantity: parseInt(createForm.expectedQuantity) }] })
      toast.success(`Receipt created: ${r}`)
      setReceiveForm(p => ({ ...p, receiptId: String(r) }))
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleReceive = async () => {
    try {
      await inboundService.receiveItem(receiveForm.receiptId, { orderId: receiveForm.orderId, skuCode: receiveForm.skuCode, binCode: receiveForm.binCode, quantity: parseInt(receiveForm.quantity) })
      toast.success(`Received ${receiveForm.quantity} of ${receiveForm.skuCode}`)
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleForceClose = async () => {
    if (!receipt) return
    try { await inboundService.forceCloseReceipt(receipt.id); toast.success("Force closed"); searchReceipt() }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted border-b border-border px-4 py-2">
        <h1 className="text-sm font-semibold flex items-center gap-2"><PackageOpen className="h-4 w-4" /> Inbound Management</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="h-8">
            <TabsTrigger value="search" className="text-xs h-7">Tra cứu phiếu nhập</TabsTrigger>
            <TabsTrigger value="create" className="text-xs h-7">Tạo phiếu nhập</TabsTrigger>
            <TabsTrigger value="receive" className="text-xs h-7">Nhận hàng (Scan)</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2 max-w-2xl">
              <Input placeholder="Order ID" className="h-9 text-sm font-mono" value={searchOrderId} onChange={e => setSearchOrderId(e.target.value)} onKeyDown={e => e.key === "Enter" && searchReceipt()} />
              <Input placeholder="Warehouse ID (opt)" className="h-9 text-sm font-mono" value={searchWarehouseId} onChange={e => setSearchWarehouseId(e.target.value)} />
              <Button onClick={searchReceipt} disabled={searchLoading} className="h-9 px-4 bg-[#C41E3A] hover:bg-[#A01830] text-white text-xs"><Search className="h-3.5 w-3.5 mr-1" />Search</Button>
            </div>
            {searchError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" />{searchError}</div>}
            {receipt && (
              <div className="space-y-4">
                <div className="border border-border bg-white">
                  <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase">Receipt Details</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 font-semibold uppercase ${statusColors[receipt.status as string] || "bg-gray-400 text-white"}`}>{receipt.status}</span>
                      {["PartiallyReceived","Pending"].includes(receipt.status as string) && <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={handleForceClose}><XCircle className="h-3 w-3 mr-1" />Force Close</Button>}
                    </div>
                  </div>
                  <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-muted-foreground block text-[10px] uppercase">Receipt No</span><span className="font-mono font-semibold">{receipt.receiptNo}</span></div>
                    <div><span className="text-muted-foreground block text-[10px] uppercase">Receipt ID</span><span className="font-mono text-[10px]">{receipt.id}</span></div>
                    <div><span className="text-muted-foreground block text-[10px] uppercase">Order ID</span><span className="font-mono text-[10px] text-blue-600">{receipt.orderId}</span></div>
                    <div><span className="text-muted-foreground block text-[10px] uppercase">Warehouse</span><span className="font-mono text-[10px]">{receipt.warehouseId}</span></div>
                    <div><span className="text-muted-foreground block text-[10px] uppercase">Source Shipment</span><span className="font-mono text-[10px]">{receipt.sourceShipmentNo || "—"}</span></div>
                    <div><span className="text-muted-foreground block text-[10px] uppercase">Created</span><span>{new Date(receipt.createdAt).toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground block text-[10px] uppercase">Received At</span><span>{receipt.receivedAt ? new Date(receipt.receivedAt).toLocaleString() : "—"}</span></div>
                  </div>
                </div>
                <div className="border border-border bg-white">
                  <div className="bg-muted px-3 py-1.5 border-b border-border"><h3 className="text-xs font-semibold uppercase">Receipt Lines</h3></div>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-[10px] uppercase h-8">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase h-8 text-center">Expected</TableHead>
                      <TableHead className="text-[10px] uppercase h-8 text-center">Received</TableHead>
                      <TableHead className="text-[10px] uppercase h-8">Progress</TableHead>
                      <TableHead className="text-[10px] uppercase h-8">Allocations</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {receipt.lines?.map(l => {
                        const pct = l.expectedQuantity > 0 ? Math.round((l.receivedQuantity / l.expectedQuantity) * 100) : 0
                        return (<TableRow key={l.id}>
                          <TableCell className="text-xs font-mono py-2">{l.skuCode}</TableCell>
                          <TableCell className="text-xs text-center py-2">{l.expectedQuantity}</TableCell>
                          <TableCell className="text-xs text-center py-2">{l.receivedQuantity}</TableCell>
                          <TableCell className="py-2"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-muted overflow-hidden max-w-[120px]"><div className={`h-full ${pct>=100?"bg-green-500":pct>0?"bg-amber-500":"bg-gray-300"}`} style={{width:`${Math.min(pct,100)}%`}}/></div><span className="text-[10px] font-mono">{pct}%</span></div></TableCell>
                          <TableCell className="py-2 text-[10px]">{l.allocations?.map(a => <span key={a.id} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 mr-1 font-mono">{a.binCode}:{a.quantity}</span>)}</TableCell>
                        </TableRow>)
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create">
            <div className="border border-border bg-white max-w-lg">
              <div className="bg-muted px-3 py-1.5 border-b border-border"><h3 className="text-xs font-semibold uppercase">Create Inbound Receipt</h3></div>
              <div className="p-4 space-y-3">
                <div><Label className="text-xs">Order ID *</Label><Input className="h-8 text-xs mt-1 font-mono" value={createForm.orderId} onChange={e=>setCreateForm({...createForm,orderId:e.target.value})} /></div>
                <div><Label className="text-xs">Warehouse ID *</Label><Input className="h-8 text-xs mt-1 font-mono" value={createForm.warehouseId} onChange={e=>setCreateForm({...createForm,warehouseId:e.target.value})} /></div>
                <div><Label className="text-xs">Source Shipment No</Label><Input className="h-8 text-xs mt-1 font-mono" value={createForm.sourceShipmentNo} onChange={e=>setCreateForm({...createForm,sourceShipmentNo:e.target.value})} /></div>
                <div className="border-t pt-3"><span className="text-xs font-semibold text-muted-foreground uppercase">Expected Lines</span>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div><Label className="text-xs">SKU Code</Label><Input className="h-8 text-xs mt-1" value={createForm.skuCode} onChange={e=>setCreateForm({...createForm,skuCode:e.target.value})} /></div>
                    <div><Label className="text-xs">Expected Qty</Label><Input className="h-8 text-xs mt-1" type="number" value={createForm.expectedQuantity} onChange={e=>setCreateForm({...createForm,expectedQuantity:e.target.value})} /></div>
                  </div>
                </div>
                <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleCreate}><Plus className="h-3 w-3 mr-1" />Create Receipt</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="receive">
            <div className="border border-border bg-white max-w-lg">
              <div className="bg-muted px-3 py-1.5 border-b border-border"><h3 className="text-xs font-semibold uppercase">Receive Inbound Item (Scan)</h3></div>
              <div className="p-4 space-y-3">
                <div><Label className="text-xs">Receipt ID *</Label><Input className="h-8 text-xs mt-1 font-mono" value={receiveForm.receiptId} onChange={e=>setReceiveForm({...receiveForm,receiptId:e.target.value})} /></div>
                <div><Label className="text-xs">Order ID *</Label><Input className="h-8 text-xs mt-1 font-mono" value={receiveForm.orderId} onChange={e=>setReceiveForm({...receiveForm,orderId:e.target.value})} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">SKU</Label><Input className="h-8 text-xs mt-1" value={receiveForm.skuCode} onChange={e=>setReceiveForm({...receiveForm,skuCode:e.target.value})} /></div>
                  <div><Label className="text-xs">Bin</Label><Input className="h-8 text-xs mt-1" value={receiveForm.binCode} onChange={e=>setReceiveForm({...receiveForm,binCode:e.target.value})} /></div>
                  <div><Label className="text-xs">Qty</Label><Input className="h-8 text-xs mt-1" type="number" value={receiveForm.quantity} onChange={e=>setReceiveForm({...receiveForm,quantity:e.target.value})} /></div>
                </div>
                <Button className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={handleReceive}><CheckCircle className="h-3 w-3 mr-1" />Receive Items</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
