"use client"

import { useState, useCallback } from "react"
import { Search, Truck, MapPin, Package, AlertTriangle, CheckCircle, Clock, ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useApi } from "@/hooks/use-api"
import * as orderingService from "@/lib/services/ordering"
import type { Order, OrderStatusHistory, OrderConsignee, OrderStatus } from "@/lib/types"

const statusColors: Record<string, string> = {
  New: "bg-gray-500",
  Confirmed: "bg-blue-400",
  AwaitingPickup: "bg-blue-500",
  PickedUp: "bg-indigo-500",
  AwaitingInbound: "bg-violet-500",
  InWarehouse: "bg-purple-500",
  Sorting: "bg-fuchsia-500",
  AwaitingDispatch: "bg-amber-500",
  Dispatched: "bg-orange-500",
  Delivering: "bg-orange-600",
  Delivered: "bg-green-500",
  Completed: "bg-emerald-600",
  Failed: "bg-red-500",
  Cancelled: "bg-gray-600",
  ReturnInTransit: "bg-pink-500",
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || "bg-gray-400"
  return (
    <span className={`${color} text-white text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider`}>
      {status}
    </span>
  )
}

export default function OrdersPage() {
  const [searchId, setSearchId] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [history, setHistory] = useState<OrderStatusHistory[]>([])
  const [consignee, setConsignee] = useState<OrderConsignee | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create order dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    skuCodes: "SKU-RED-TSHIRT",
    weight: "1.5",
    shippingFee: "35000",
    codAmount: "500000",
    note: "",
    fullName: "Nguyen Van A",
    phone: "0901234567",
    street: "123 Nguyen Trai",
    city: "Ho Chi Minh",
    state: "HCM",
    country: "Vietnam",
    zipCode: "70000",
  })

  // Action dialog
  const [actionOpen, setActionOpen] = useState(false)
  const [actionType, setActionType] = useState<string>("")
  const [actionInput, setActionInput] = useState("")
  const [actionInput2, setActionInput2] = useState("")

  const searchOrder = useCallback(async () => {
    if (!searchId.trim()) return
    setLoading(true)
    setError(null)
    try {
      const [orderRes, historyRes, consigneeRes] = await Promise.allSettled([
        orderingService.getOrderById(searchId.trim()),
        orderingService.getOrderStatusHistory(searchId.trim()),
        orderingService.getOrderConsignee(searchId.trim()),
      ])

      if (orderRes.status === "fulfilled" && orderRes.value.isSuccess && orderRes.value.value) {
        setOrder(orderRes.value.value)
      } else {
        setError("Order not found")
        setOrder(null)
      }

      if (historyRes.status === "fulfilled" && historyRes.value.isSuccess && historyRes.value.value) {
        setHistory(historyRes.value.value as unknown as OrderStatusHistory[])
      } else {
        setHistory([])
      }

      if (consigneeRes.status === "fulfilled" && consigneeRes.value.isSuccess && consigneeRes.value.value) {
        setConsignee(consigneeRes.value.value)
      } else {
        setConsignee(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch order")
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [searchId])

  const handleCreateOrder = async () => {
    try {
      const result = await orderingService.createOrder({
        skuCodes: createForm.skuCodes.split(",").map((s) => s.trim()),
        weight: parseFloat(createForm.weight),
        shippingFee: parseFloat(createForm.shippingFee),
        codAmount: parseFloat(createForm.codAmount),
        note: createForm.note || undefined,
        consignee: {
          fullName: createForm.fullName,
          phone: createForm.phone,
          address: {
            street: createForm.street,
            city: createForm.city,
            state: createForm.state,
            country: createForm.country,
            zipCode: createForm.zipCode,
          },
        },
      })
      if (result.isSuccess) {
        toast.success(`Order created: ${result.value}`)
        setSearchId(result.value || "")
        setCreateOpen(false)
      } else {
        toast.error(result.error?.message || "Failed to create order")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create order")
    }
  }

  const executeAction = async () => {
    if (!order) return
    try {
      let result
      switch (actionType) {
        case "pickup":
          result = await orderingService.pickupOrder(order.id, actionInput)
          break
        case "dispatch":
          result = await orderingService.dispatchOrder(order.id, actionInput, actionInput2)
          break
        case "deliver":
          result = await orderingService.deliverOrder(order.id, actionInput)
          break
        case "fail":
          result = await orderingService.failDelivery(order.id, actionInput)
          break
      }
      if (result?.isSuccess !== false) {
        toast.success(`Action "${actionType}" executed successfully`)
        setActionOpen(false)
        setActionInput("")
        setActionInput2("")
        searchOrder()
      } else {
        toast.error(result?.error?.message || "Action failed")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    }
  }

  const getAvailableActions = (status: string) => {
    const actions: { key: string; label: string; icon: React.ReactNode; fields: string[] }[] = []
    switch (status) {
      case "AwaitingPickup":
        actions.push({ key: "pickup", label: "Pickup", icon: <Truck className="h-3 w-3" />, fields: ["Driver ID"] })
        break
      case "AwaitingDispatch":
        actions.push({ key: "dispatch", label: "Dispatch", icon: <MapPin className="h-3 w-3" />, fields: ["Driver ID", "Route ID"] })
        break
      case "Dispatched":
      case "Delivering":
        actions.push({ key: "deliver", label: "Deliver", icon: <CheckCircle className="h-3 w-3" />, fields: ["Proof of Delivery URL"] })
        actions.push({ key: "fail", label: "Fail Delivery", icon: <AlertTriangle className="h-3 w-3" />, fields: ["Reason"] })
        break
    }
    return actions
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted border-b border-border px-4 py-2 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Order Management</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white">
              <Plus className="h-3 w-3 mr-1" /> Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm">Create New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">SKU Codes (comma-sep)</Label><Input className="h-8 text-xs mt-1" value={createForm.skuCodes} onChange={(e) => setCreateForm({ ...createForm, skuCodes: e.target.value })} /></div>
                <div><Label className="text-xs">Weight (kg)</Label><Input className="h-8 text-xs mt-1" value={createForm.weight} onChange={(e) => setCreateForm({ ...createForm, weight: e.target.value })} /></div>
                <div><Label className="text-xs">Shipping Fee</Label><Input className="h-8 text-xs mt-1" value={createForm.shippingFee} onChange={(e) => setCreateForm({ ...createForm, shippingFee: e.target.value })} /></div>
                <div><Label className="text-xs">COD Amount</Label><Input className="h-8 text-xs mt-1" value={createForm.codAmount} onChange={(e) => setCreateForm({ ...createForm, codAmount: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">Note</Label><Textarea className="text-xs mt-1" rows={2} value={createForm.note} onChange={(e) => setCreateForm({ ...createForm, note: e.target.value })} /></div>
              <div className="border-t pt-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Consignee (Người nhận)</span>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div><Label className="text-xs">Full Name</Label><Input className="h-8 text-xs mt-1" value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} /></div>
                  <div><Label className="text-xs">Phone</Label><Input className="h-8 text-xs mt-1" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} /></div>
                  <div className="col-span-2"><Label className="text-xs">Street</Label><Input className="h-8 text-xs mt-1" value={createForm.street} onChange={(e) => setCreateForm({ ...createForm, street: e.target.value })} /></div>
                  <div><Label className="text-xs">City</Label><Input className="h-8 text-xs mt-1" value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} /></div>
                  <div><Label className="text-xs">State</Label><Input className="h-8 text-xs mt-1" value={createForm.state} onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })} /></div>
                  <div><Label className="text-xs">Country</Label><Input className="h-8 text-xs mt-1" value={createForm.country} onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })} /></div>
                  <div><Label className="text-xs">Zip Code</Label><Input className="h-8 text-xs mt-1" value={createForm.zipCode} onChange={(e) => setCreateForm({ ...createForm, zipCode: e.target.value })} /></div>
                </div>
              </div>
              <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleCreateOrder}>Create Order</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 space-y-4 overflow-auto flex-1">
        {/* Search */}
        <div className="flex gap-2 max-w-xl">
          <Input
            placeholder="Enter Order ID (GUID)..."
            className="h-9 text-sm font-mono"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchOrder()}
          />
          <Button onClick={searchOrder} disabled={loading} className="h-9 px-4 bg-[#C41E3A] hover:bg-[#A01830] text-white text-xs">
            <Search className="h-3.5 w-3.5 mr-1" /> {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-xs flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" /> {error}
          </div>
        )}

        {order && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Order Info */}
            <div className="lg:col-span-2 space-y-4">
              {/* Basic Info Card */}
              <div className="border border-border bg-white">
                <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide">Order Details</h3>
                  <StatusBadge status={order.status as string} />
                </div>
                <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Waybill Code</span>
                    <span className="font-mono font-semibold text-blue-600">{order.waybillCode}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Order ID</span>
                    <span className="font-mono text-[10px]">{order.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">COD Amount</span>
                    <span className="font-semibold text-green-600">{Number(order.codAmount).toLocaleString()}₫</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Shipping Fee</span>
                    <span className="font-semibold">{Number(order.shippingFee).toLocaleString()}₫</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Weight</span>
                    <span>{order.weight} kg</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Consignor</span>
                    <span className="font-mono text-[10px]">{order.consignorId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Created</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Delivery Attempts</span>
                    <span>{order.deliveryAttempts}</span>
                  </div>
                </div>
                {order.note && (
                  <div className="px-3 pb-3">
                    <span className="text-muted-foreground text-[10px] uppercase">Note: </span>
                    <span className="text-xs italic">{order.note}</span>
                  </div>
                )}

                {/* Actions */}
                {getAvailableActions(order.status as string).length > 0 && (
                  <div className="px-3 pb-3 flex gap-2">
                    {getAvailableActions(order.status as string).map((action) => (
                      <Button
                        key={action.key}
                        size="sm"
                        className="h-7 text-[10px] bg-[#C41E3A] hover:bg-[#A01830] text-white"
                        onClick={() => {
                          setActionType(action.key)
                          setActionInput("")
                          setActionInput2("")
                          setActionOpen(true)
                        }}
                      >
                        {action.icon}
                        <span className="ml-1">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Consignee */}
              {(consignee || order.consignee) && (
                <div className="border border-border bg-white">
                  <div className="bg-muted px-3 py-1.5 border-b border-border">
                    <h3 className="text-xs font-semibold uppercase tracking-wide">Consignee (Người nhận)</h3>
                  </div>
                  <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Full Name</span>
                      <span className="font-medium">{consignee?.fullName || order.consignee?.fullName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Phone</span>
                      <span className="font-mono">{consignee?.phone || order.consignee?.phone}</span>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <span className="text-muted-foreground block text-[10px] uppercase">Address</span>
                      <span>
                        {consignee ? `${consignee.street}, ${consignee.city}, ${consignee.state}, ${consignee.country} ${consignee.zipCode}` 
                        : order.consignee?.address ? `${order.consignee.address.street}, ${order.consignee.address.city}` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Status Timeline */}
            <div className="border border-border bg-white">
              <div className="bg-muted px-3 py-1.5 border-b border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wide">Status Timeline</h3>
              </div>
              <div className="p-3 max-h-[500px] overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No history available</p>
                ) : (
                  <div className="space-y-0">
                    {[...history].reverse().map((h, i) => (
                      <div key={h.id || i} className="flex gap-3 pb-4 relative">
                        {/* Timeline line */}
                        {i < history.length - 1 && (
                          <div className="absolute left-[11px] top-5 w-0.5 h-[calc(100%-8px)] bg-border" />
                        )}
                        {/* Dot */}
                        <div className={`shrink-0 mt-0.5 h-[22px] w-[22px] flex items-center justify-center ${i === 0 ? "bg-[#C41E3A]" : "bg-muted border border-border"}`}>
                          {i === 0 ? (
                            <CheckCircle className="h-3 w-3 text-white" />
                          ) : (
                            <Clock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {h.statusFrom && (
                              <>
                                <StatusBadge status={h.statusFrom} />
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              </>
                            )}
                            <StatusBadge status={h.statusTo} />
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                            <div>{new Date(h.changedAt).toLocaleString()}</div>
                            <div>Source: <span className="font-medium text-foreground">{h.source}</span></div>
                            {h.changedByOperatorId && <div>By: <span className="font-mono">{h.changedByOperatorId}</span></div>}
                            {h.correlationId && <div>Corr: <span className="font-mono text-[9px]">{h.correlationId}</span></div>}
                            {h.reason && <div className="text-orange-600">Reason: {h.reason}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm capitalize">{actionType} Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div>
              <Label className="text-xs">{actionType === "pickup" ? "Driver ID" : actionType === "dispatch" ? "Driver ID" : actionType === "deliver" ? "Proof of Delivery URL" : "Reason"}</Label>
              <Input className="h-8 text-xs mt-1" value={actionInput} onChange={(e) => setActionInput(e.target.value)} placeholder={actionType === "pickup" ? "driver_01" : actionType === "deliver" ? "https://..." : ""} />
            </div>
            {actionType === "dispatch" && (
              <div>
                <Label className="text-xs">Route ID</Label>
                <Input className="h-8 text-xs mt-1" value={actionInput2} onChange={(e) => setActionInput2(e.target.value)} placeholder="route_01" />
              </div>
            )}
            <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={executeAction}>
              Execute {actionType}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
