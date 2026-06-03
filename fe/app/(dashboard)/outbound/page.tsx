"use client"

import { useState, useEffect } from "react"
import { Search, Truck, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import * as outboundService from "@/lib/services/outbound"
import type { Shipment, OutboundOrder } from "@/lib/types"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"

const shipmentStatusMap: Record<number | string, { label: string, cls: string }> = {
  0: { label: "Pending", cls: "bg-blue-500 text-white" }, Pending: { label: "Pending", cls: "bg-blue-500 text-white" },
  1: { label: "Dispatched", cls: "bg-amber-500 text-white" }, Dispatched: { label: "Dispatched", cls: "bg-amber-500 text-white" },
  2: { label: "Delivered", cls: "bg-green-500 text-white" }, Delivered: { label: "Delivered", cls: "bg-green-500 text-white" },
}

export default function OutboundPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [shipmentsLoading, setShipmentsLoading] = useState(false)
  const [outboundOrderId, setOutboundOrderId] = useState("")
  const [outboundOrder, setOutboundOrder] = useState<OutboundOrder | null>(null)
  const [obError, setObError] = useState<string | null>(null)
  const [sortForm, setSortForm] = useState({ orderId: "", destinationWarehouseId: "", sourceShipmentNo: "" })
  const [qrOrderId, setQrOrderId] = useState("")

  const loadShipments = async () => {
    setShipmentsLoading(true)
    try { setShipments(await outboundService.getShipments()) }
    catch { toast.error("Failed to load shipments") }
    finally { setShipmentsLoading(false) }
  }

  useEffect(() => { loadShipments() }, [])

  const searchOutbound = async () => {
    if (!outboundOrderId.trim()) return
    setObError(null)
    try { setOutboundOrder(await outboundService.getOutboundOrder(outboundOrderId.trim())) }
    catch (e) { setObError(e instanceof Error ? e.message : "Not found"); setOutboundOrder(null) }
  }

  const handleSort = async () => {
    try {
      await outboundService.sortOrder({ orderId: sortForm.orderId, destinationWarehouseId: sortForm.destinationWarehouseId, sourceShipmentNo: sortForm.sourceShipmentNo || undefined })
      toast.success("Order sorted successfully!")
      loadShipments()
    } catch (e) { toast.error(e instanceof Error ? e.message : "Sort failed") }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted border-b border-border px-4 py-2">
        <h1 className="text-sm font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Outbound Management</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="shipments" className="space-y-4">
          <TabsList className="h-8">
            <TabsTrigger value="shipments" className="text-xs h-7">Shipments</TabsTrigger>
            <TabsTrigger value="outbound" className="text-xs h-7">Outbound Orders</TabsTrigger>
            <TabsTrigger value="sort" className="text-xs h-7">Sort Order</TabsTrigger>
            <TabsTrigger value="qrcode" className="text-xs h-7">In tem QR Kiện hàng</TabsTrigger>
          </TabsList>

          <TabsContent value="shipments" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{shipments.length} shipments</span>
              <Button size="sm" className="h-7 text-xs" variant="outline" onClick={loadShipments} disabled={shipmentsLoading}>Refresh</Button>
            </div>
            <div className="border border-border bg-white">
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/80">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase h-8">Shipment No</TableHead>
                      <TableHead className="text-[10px] uppercase h-8">Warehouse</TableHead>
                      <TableHead className="text-[10px] uppercase h-8">Dest Type</TableHead>
                      <TableHead className="text-[10px] uppercase h-8">Destination</TableHead>
                      <TableHead className="text-[10px] uppercase h-8">Status</TableHead>
                      <TableHead className="text-[10px] uppercase h-8">Shipped At</TableHead>
                      <TableHead className="text-[10px] uppercase h-8">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map(s => {
                      const st = shipmentStatusMap[s.status] || { label: String(s.status), cls: "bg-gray-400 text-white" }
                      return (<TableRow key={s.id}>
                        <TableCell className="text-xs font-mono py-2">{s.shipmentNo}</TableCell>
                        <TableCell className="text-xs font-mono py-2 text-[10px]">{s.warehouseId?.slice(0, 8)}...</TableCell>
                        <TableCell className="text-xs py-2">{s.destinationType === 0 || s.destinationType as unknown === "Warehouse" ? "Warehouse" : "Customer"}</TableCell>
                        <TableCell className="text-xs font-mono py-2 text-[10px]">{s.destinationId?.slice(0, 8)}...</TableCell>
                        <TableCell className="py-2"><span className={`text-[10px] px-2 py-0.5 font-semibold uppercase ${st.cls}`}>{st.label}</span></TableCell>
                        <TableCell className="text-xs py-2">{s.shippedAt ? new Date(s.shippedAt).toLocaleString() : "—"}</TableCell>
                        <TableCell className="text-xs py-2">{new Date(s.createdAt).toLocaleString()}</TableCell>
                      </TableRow>)
                    })}
                    {shipments.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No shipments found</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="outbound" className="space-y-4">
            <div className="flex gap-2 max-w-xl">
              <Input placeholder="Order ID (GUID)" className="h-9 text-sm font-mono" value={outboundOrderId} onChange={e => setOutboundOrderId(e.target.value)} onKeyDown={e => e.key === "Enter" && searchOutbound()} />
              <Button onClick={searchOutbound} className="h-9 px-4 bg-[#C41E3A] hover:bg-[#A01830] text-white text-xs"><Search className="h-3.5 w-3.5 mr-1" />Search</Button>
            </div>
            {obError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs">{obError}</div>}
            {outboundOrder && (
              <div className="border border-border bg-white max-w-lg">
                <div className="bg-muted px-3 py-1.5 border-b border-border"><h3 className="text-xs font-semibold uppercase">Outbound Order</h3></div>
                <div className="p-3 grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground block text-[10px] uppercase">ID</span><span className="font-mono text-[10px]">{outboundOrder.id}</span></div>
                  <div><span className="text-muted-foreground block text-[10px] uppercase">Order ID</span><span className="font-mono text-[10px] text-blue-600">{outboundOrder.orderId}</span></div>
                  <div><span className="text-muted-foreground block text-[10px] uppercase">Status</span><span className="font-semibold">{outboundOrder.status}</span></div>
                  <div><span className="text-muted-foreground block text-[10px] uppercase">Warehouse</span><span className="font-mono text-[10px]">{outboundOrder.warehouseId}</span></div>
                  <div><span className="text-muted-foreground block text-[10px] uppercase">Created</span><span>{new Date(outboundOrder.createdAt).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground block text-[10px] uppercase">Planned Ship</span><span>{outboundOrder.plannedShipAt ? new Date(outboundOrder.plannedShipAt).toLocaleString() : "—"}</span></div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sort">
            <div className="border border-border bg-white max-w-lg">
              <div className="bg-muted px-3 py-1.5 border-b border-border"><h3 className="text-xs font-semibold uppercase">Sort Order (Phân loại)</h3></div>
              <div className="p-4 space-y-3">
                <div><Label className="text-xs">Order ID *</Label><Input className="h-8 text-xs mt-1 font-mono" value={sortForm.orderId} onChange={e => setSortForm({ ...sortForm, orderId: e.target.value })} /></div>
                <div><Label className="text-xs">Destination Warehouse ID *</Label><Input className="h-8 text-xs mt-1 font-mono" value={sortForm.destinationWarehouseId} onChange={e => setSortForm({ ...sortForm, destinationWarehouseId: e.target.value })} /></div>
                <div><Label className="text-xs">Source Shipment No</Label><Input className="h-8 text-xs mt-1 font-mono" value={sortForm.sourceShipmentNo} onChange={e => setSortForm({ ...sortForm, sourceShipmentNo: e.target.value })} /></div>
                <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleSort}><ArrowRightLeft className="h-3 w-3 mr-1" />Sort Order</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qrcode">
            <div className="border border-border bg-white max-w-lg">
              <div className="bg-muted px-3 py-1.5 border-b border-border"><h3 className="text-xs font-semibold uppercase">In tem QR Kiện hàng (Outbound)</h3></div>
              <div className="p-4 space-y-4 flex flex-col items-center">
                <div className="w-full">
                  <Label className="text-xs">Mã Order ID cần xuất kho</Label>
                  <Input 
                    className="h-8 text-xs mt-1 font-mono" 
                    placeholder="Nhập OrderId để tạo QR..." 
                    value={qrOrderId} 
                    onChange={e => setQrOrderId(e.target.value)} 
                  />
                </div>
                {qrOrderId.trim() ? (
                  <QRCodeDisplay 
                    value={qrOrderId.trim()} 
                    title="Lệnh Xuất (Outbound)" 
                    subtitle="Dùng để quét phân loại xuất kho" 
                    size={160} 
                  />
                ) : (
                  <div className="text-xs text-muted-foreground py-10">Vui lòng nhập mã để tạo QR</div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
