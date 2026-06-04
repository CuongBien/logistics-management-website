"use client"

import { useState, useEffect } from "react"
import { getDiscrepancies, getTransitDiscrepancies, resolveDiscrepancy, resolveTransitDiscrepancy } from "@/lib/api/wms-inbound"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, FileText, Search, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs"

export default function DiscrepanciesPage() {
  const [inboundDiscrepancies, setInboundDiscrepancies] = useState<any[]>([])
  const [transitDiscrepancies, setTransitDiscrepancies] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("inbound")

  // Resolve Dialog States
  const [resolveOpen, setResolveOpen] = useState(false)
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<any | null>(null)
  const [resolutionStatus, setResolutionStatus] = useState<number>(4) // Default: Resolved = 4
  const [notes, setNotes] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [inboundData, transitData] = await Promise.all([
        getDiscrepancies(),
        getTransitDiscrepancies()
      ])
      setInboundDiscrepancies(inboundData)
      setTransitDiscrepancies(transitData)
    } catch (e) {
      toast.error("Không thể tải danh sách sai lệch hàng hóa")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleResolveClick = (item: any) => {
    setSelectedDiscrepancy(item)
    setNotes("")
    setResolutionStatus(4) // Mặc định Resolved (4)
    setResolveOpen(true)
  }

  const handleConfirmResolve = async () => {
    if (!selectedDiscrepancy) return
    setIsLoading(true)
    setResolveOpen(false)
    try {
      if (activeTab === "inbound") {
        await resolveDiscrepancy(selectedDiscrepancy.id, resolutionStatus, notes)
        toast.success("Giải quyết chênh lệch nhập kho thành công!")
      } else {
        await resolveTransitDiscrepancy(selectedDiscrepancy.id, resolutionStatus, notes)
        toast.success("Giải quyết chênh lệch vận chuyển trung chuyển thành công!")
      }
      loadData()
    } catch (e: any) {
      toast.error(e.message || "Giải quyết sai lệch thất bại")
    } finally {
      setIsLoading(false)
      setSelectedDiscrepancy(null)
    }
  }

  // Format Inbound Status
  const formatInboundStatus = (status: string | number) => {
    // API client map d.status === 4 ? 'ResolvedApprove' : 'Pending'
    if (status === 'ResolvedApprove' || status === 4) {
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5"><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> Đã xử lý (Resolved)</Badge>;
    }
    return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5"><AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> Đang điều tra</Badge>;
  }

  // Format Transit Status
  const formatTransitStatus = (status: number) => {
    switch (status) {
      case 4:
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5"><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> Đã xử lý</Badge>;
      case 1:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5"><AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> Đang điều tra</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold px-2 py-0.5">Tài xế chịu trách nhiệm</Badge>;
      case 3:
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 font-bold px-2 py-0.5">Kho hao hụt (Write-off)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Filtering
  const filteredInbound = inboundDiscrepancies.filter(
    (d) =>
      d.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredTransit = transitDiscrepancies.filter(
    (d) =>
      d.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.notes && d.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Giám Sát & Xử Lý Sai Lệch Hàng Hóa (Discrepancies)
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và giải quyết các biên bản chênh lệch hàng hóa nhập kho (OS&D) và hàng thất thoát trong quá trình trung chuyển giữa các Hub.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-muted p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sai lệch theo mã hàng SKU, ghi chú hoặc đơn vị vận chuyển..."
            className="pl-10 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inbound" onValueChange={setActiveTab} className="w-full flex-1 flex flex-col space-y-4">
        <TabsList className="bg-muted/65 border border-muted w-full sm:w-auto p-1 h-11 shrink-0 flex items-stretch">
          <TabsTrigger value="inbound" className="text-xs font-bold rounded flex-1 sm:flex-none px-6">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Nhập Kho Chênh Lệch (OS&D)
          </TabsTrigger>
          <TabsTrigger value="transit" className="text-xs font-bold rounded flex-1 sm:flex-none px-6">
            <FileText className="h-4 w-4 mr-1.5" />
            Trung Chuyển Thất Thoát (Transit)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbound" className="flex-1 m-0 focus-visible:outline-none">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold w-[120px]">Phân Loại</TableHead>
                    <TableHead className="font-bold">Mã SKU</TableHead>
                    <TableHead className="font-bold text-right">Khai Báo</TableHead>
                    <TableHead className="font-bold text-right">Nhận Thực Tế</TableHead>
                    <TableHead className="font-bold text-right">Sai Lệch</TableHead>
                    <TableHead className="font-bold text-center">Trạng Thái</TableHead>
                    <TableHead className="font-bold">Mô Tả / Lý Do</TableHead>
                    <TableHead className="font-bold text-right w-[140px]">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInbound.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                        Chưa ghi nhận chênh lệch hàng hóa nhập kho (OS&D) nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInbound.map((item) => {
                      const diff = item.actualQty - item.expectedQty
                      const isOverage = diff > 0

                      return (
                        <TableRow key={item.id} className="hover:bg-muted/15 transition-colors">
                          <TableCell className="align-middle">
                            <Badge className={item.type === 'Over' ? "bg-emerald-500 text-white font-bold" : "bg-rose-500 text-white font-bold"}>
                              {item.type === 'Over' ? 'Dư thừa' : item.type === 'Short' ? 'Thiếu hàng' : 'Hư hỏng'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-bold text-primary align-middle">
                            {item.sku}
                          </TableCell>
                          <TableCell className="text-right font-mono align-middle">
                            {item.expectedQty}
                          </TableCell>
                          <TableCell className="text-right font-mono align-middle font-semibold">
                            {item.actualQty}
                          </TableCell>
                          <TableCell className={`text-right font-mono font-extrabold align-middle ${isOverage ? "text-emerald-600" : "text-rose-600"}`}>
                            {isOverage ? `+${diff}` : diff}
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            {formatInboundStatus(item.status)}
                          </TableCell>
                          <TableCell className="align-middle text-sm max-w-[200px] truncate text-muted-foreground">
                            {item.notes}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            {(item.status !== 'ResolvedApprove' && item.status !== 4) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveClick(item)}
                                className="h-8 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/20"
                              >
                                Giải quyết
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic mr-2 select-none">Đã xử lý</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transit" className="flex-1 m-0 focus-visible:outline-none">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold">Mã SKU</TableHead>
                    <TableHead className="font-bold">Nhà Vận Chuyển</TableHead>
                    <TableHead className="font-bold text-right">Xuất Phát</TableHead>
                    <TableHead className="font-bold text-right">Đến Thực Tế</TableHead>
                    <TableHead className="font-bold text-right">Sai Lệch</TableHead>
                    <TableHead className="font-bold text-center">Trạng Thái</TableHead>
                    <TableHead className="font-bold">Ghi Chú</TableHead>
                    <TableHead className="font-bold text-right w-[140px]">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransit.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                        Chưa phát hiện sai lệch trung chuyển.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransit.map((item) => {
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/15 transition-colors">
                          <TableCell className="font-mono font-bold text-primary align-middle">
                            {item.sku}
                          </TableCell>
                          <TableCell className="align-middle font-medium">
                            {item.carrierName}
                          </TableCell>
                          <TableCell className="text-right font-mono align-middle">
                            {item.expectedQty}
                          </TableCell>
                          <TableCell className="text-right font-mono align-middle font-semibold">
                            {item.receivedQty}
                          </TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-rose-600 align-middle">
                            {item.discrepancyQty > 0 ? `-${item.discrepancyQty}` : item.discrepancyQty}
                          </TableCell>
                          <TableCell className="align-middle text-center">
                            {formatTransitStatus(item.status)}
                          </TableCell>
                          <TableCell className="align-middle text-sm max-w-[200px] truncate text-muted-foreground">
                            {item.notes}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            {item.status === 1 ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveClick(item)}
                                className="h-8 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/20"
                              >
                                Giải quyết
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic mr-2 select-none">Đã xử lý</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Giải Quyết Sai Lệch Hàng Hóa
            </DialogTitle>
            <DialogDescription>
              Vui lòng chỉ định cách giải quyết và nhập giải trình nghiệp vụ xử lý chênh lệch cho SKU <span className="font-bold text-foreground font-mono">{selectedDiscrepancy?.sku}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="status">Phương án xử lý</Label>
              <select
                id="status"
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeTab === "inbound" ? (
                  <>
                    <option value={4}>Resolved (Khớp số liệu thực nhận)</option>
                    <option value={2}>Merchant Liability (Nhà cung cấp chịu trách nhiệm)</option>
                    <option value={3}>Warehouse Write-Off (Kho chịu hao hụt)</option>
                  </>
                ) : (
                  <>
                    <option value={4}>Resolved (Xác nhận khớp số liệu mới)</option>
                    <option value={2}>Driver Liability (Tài xế chịu trách nhiệm)</option>
                    <option value={3}>Warehouse Write-Off (Kho chịu hao hụt)</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Ghi chú giải trình</Label>
              <Input
                id="notes"
                placeholder="Nhập lý do xử lý, ví dụ: Nhà cung cấp giao bù, Hao hụt tự nhiên..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setResolveOpen(false)}>
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleConfirmResolve}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Xác nhận giải quyết
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
