"use client"

import { useEffect, useState } from "react"
import { getItems, toggleActiveStatus } from "@/lib/api/master-data"
import { ItemDto } from "@/types/master-data"
import { ItemMasterForm } from "@/components/wms/masterdata/ItemMasterForm"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog"
import { useSession } from "next-auth/react"
import { getQrImageUrl } from "@/lib/services/qrcode"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@repo/ui/components/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui/components/select"
import { Badge } from "@repo/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card"
import {
  Edit2,
  Lock,
  Unlock,
  Package,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  ArrowRight,
  QrCode
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@repo/ui/components/skeleton"

export default function ItemMasterPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<ItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemDto | null>(null)
  
  // Printable QR Code Dialog states
  const [printQrUrl, setPrintQrUrl] = useState<string | null>(null)
  const [printQrTitle, setPrintQrTitle] = useState("")

  const loadPrintQr = async (skuCode: string) => {
    try {
      const url = await getQrImageUrl('sku', skuCode, session?.accessToken)
      setPrintQrUrl(url)
      setPrintQrTitle(`Mã sản phẩm SKU: ${skuCode}`)
    } catch (e) {
      toast.error("Không thể sinh ảnh QR Code cho SKU này.")
    }
  }

  const handlePrint = () => {
    if (!printQrUrl) return
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>In nhãn QR - ${printQrTitle}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: monospace; }
              img { width: 300px; height: 300px; }
              .title { font-size: 24px; font-weight: bold; margin-top: 15px; }
              .footer { font-size: 14px; color: #555; margin-top: 5px; }
            </style>
          </head>
          <body>
            <img src="${printQrUrl}" onload="window.print(); window.close();" />
            <div class="title">${printQrTitle}</div>
            <div class="footer">Hệ thống Logistics Management System (LMS)</div>
          </body>
        </html>
      `)
      win.document.close()
    }
  }
  // Tracking intermediate status change loaders per-row
  const [togglingRows, setTogglingRows] = useState<Record<string, boolean>>({})

  const fetchItemData = async () => {
    try {
      setLoading(true)
      const data = await getItems()
      setItems(data)
    } catch (e: any) {
      toast.error("Không thể tải danh sách sản phẩm dữ liệu chủ")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItemData()
  }, [])

  const handleToggleActive = async (item: ItemDto) => {
    try {
      setTogglingRows((prev) => ({ ...prev, [item.id]: true }))
      const updated = await toggleActiveStatus(item, !item.isActive)
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)))
      
      if (updated.isActive) {
        toast.success(`Đã kích hoạt hoạt động thành công cho SKU: ${item.sku}`)
      } else {
        toast.warning(`Đã dừng hoạt động (Khóa) thành công cho SKU: ${item.sku}`)
      }
    } catch (e: any) {
      toast.error(e.message || "Không thể chuyển đổi trạng thái hoạt động")
    } finally {
      setTogglingRows((prev) => ({ ...prev, [item.id]: false }))
    }
  }

  const handleOpenCreateForm = () => {
    setSelectedItem(null)
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (item: ItemDto) => {
    setSelectedItem(item)
    setIsFormOpen(true)
  }

  // Client-side search and category filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase())
    
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Compute metrics
  const totalItems = items.length
  const activeItemsCount = items.filter((i) => i.isActive).length
  const inactiveItemsCount = totalItems - activeItemsCount

  const uniqueCategories = Array.from(new Set(items.map((i) => i.category)))

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header bar */}
      <div className="bg-muted/40 border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-foreground tracking-tight">
            <Database className="h-5 w-5 text-[#C41E3A]" />
            Quản lý Dữ liệu Chủ: Sản phẩm (Item Master)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cấu hình danh mục sản phẩm nền tảng, quản lý thông số vật lý và kiểm soát luồng hoạt động trong kho WMS/OMS.
          </p>
        </div>
        
        <Button
          size="sm"
          onClick={handleOpenCreateForm}
          className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold h-9 text-xs rounded-md shadow-sm self-start md:self-center"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Thêm sản phẩm SKU
        </Button>
      </div>

      <div className="px-6 space-y-4 flex-1 overflow-y-auto pb-6">
        
        {/* Analytics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tổng danh mục SKU
              </CardTitle>
              <Package className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-foreground">
                {loading ? <Skeleton className="h-8 w-16" /> : totalItems}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Các mặt hàng cấu hình trong hệ thống
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                SKU Đang Hoạt Động
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {loading ? <Skeleton className="h-8 w-16" /> : activeItemsCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Cho phép tham gia luồng WMS & OMS
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                SKU Ngừng Hoạt Động
              </CardTitle>
              <XCircle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {loading ? <Skeleton className="h-8 w-16" /> : inactiveItemsCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Đang bị khóa/Chờ kích hoạt lại
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card border border-muted rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto items-stretch sm:items-center">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm SKU hoặc tên sản phẩm..."
                className="pl-9 h-9 rounded-md text-xs bg-background border-muted"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* Category Select Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-full sm:w-44 text-xs bg-background border-muted rounded-md">
                <SelectValue placeholder="Lọc theo ngành hàng" />
              </SelectTrigger>
              <SelectContent className="bg-card border-muted rounded-md text-xs">
                <SelectItem value="all" className="cursor-pointer text-xs">
                  Tất cả ngành hàng
                </SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="cursor-pointer text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-[10px] text-muted-foreground font-medium self-end sm:self-center">
            Hiển thị <span className="text-foreground font-bold">{filteredItems.length}</span> trên tổng số <span className="text-foreground font-bold">{totalItems}</span> SKU
          </p>
        </div>

        {/* Main DataTable Grid */}
        <div className="border border-muted bg-card rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-muted">
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36">
                  Mã SKU
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground">
                  Tên Chi Tiết Sản Phẩm
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-32">
                  Ngành Hàng
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28 text-center">
                  Trọng Lượng (kg)
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36 text-center">
                  Kích Thước (DxRxC)
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-24 text-center">
                  Trạng Thái
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28 text-right">
                  Thao Tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-muted">
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground/60 stroke-[1.5]" />
                      <p className="font-semibold">Không tìm thấy sản phẩm dữ liệu chủ nào khớp</p>
                      <p className="text-[10px] text-muted-foreground/80">
                        Thử điều chỉnh từ khóa tìm kiếm hoặc lọc danh mục ngành hàng khác.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/10 border-b border-muted transition-colors">
                    {/* SKU Code */}
                    <TableCell className="text-xs font-bold font-mono text-[#C41E3A] tracking-wider uppercase">
                      {item.sku}
                    </TableCell>
                    
                    {/* Product Name */}
                    <TableCell className="text-xs font-semibold text-foreground max-w-sm truncate">
                      {item.name}
                    </TableCell>
                    
                    {/* Category */}
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="bg-background text-muted-foreground border-muted font-medium text-[10px] rounded-md">
                        {item.category}
                      </Badge>
                    </TableCell>
                    
                    {/* Weight */}
                    <TableCell className="text-xs text-center font-mono font-medium">
                      {item.weight.toFixed(3)}
                    </TableCell>
                    
                    {/* Dimensions */}
                    <TableCell className="text-xs text-center font-mono text-muted-foreground font-semibold">
                      {item.length} × {item.width} × {item.height}
                    </TableCell>
                    
                    {/* Status Badge */}
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          }`}
                        />
                        {item.isActive ? "Hoạt động" : "Tạm khóa"}
                      </Badge>
                    </TableCell>
                    
                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* QR Code Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => loadPrintQr(item.sku)}
                          className="h-7 w-7 rounded-md hover:bg-slate-100 text-muted-foreground hover:text-[#C41E3A] transition-colors"
                          title="Xem mã QR của SKU"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditForm(item)}
                          className="h-7 w-7 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-600 transition-colors"
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        
                        {/* Activate/Deactivate Toggle Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={togglingRows[item.id]}
                          onClick={() => handleToggleActive(item)}
                          className={`h-7 w-7 rounded-md transition-colors ${
                            item.isActive
                              ? "hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600"
                              : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600"
                          }`}
                          title={item.isActive ? "Ngừng hoạt động (Khóa SKU)" : "Kích hoạt hoạt động"}
                        >
                          {item.isActive ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Sliding Entry Form Overlay */}
      <ItemMasterForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        selectedItem={selectedItem}
        onSuccess={fetchItemData}
      />

      {/* Printable QR Code Dialog */}
      {printQrUrl && (
        <Dialog open={!!printQrUrl} onOpenChange={(open) => !open && setPrintQrUrl(null)}>
          <DialogContent className="max-w-xs w-full bg-slate-900 border-slate-800 shadow-2xl text-white">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C41E3A]" />
            <DialogHeader className="pb-2">
              <DialogTitle className="text-sm font-bold text-slate-100">Tem Nhãn QR Code SKU</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400 font-mono mt-0.5">{printQrTitle}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-white p-3 rounded-lg flex items-center justify-center border border-slate-800">
                <img src={printQrUrl} className="w-48 h-48 block" alt="Printable QR Code" />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => setPrintQrUrl(null)}
                >
                  Đóng
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-[#C41E3A] hover:bg-[#a01830] text-white font-bold"
                  onClick={handlePrint}
                >
                  In mã QR
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
