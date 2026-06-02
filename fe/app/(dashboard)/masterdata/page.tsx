"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Database,
  Package,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  MapPin,
  Phone,
  Building
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

import * as masterdataService from "@/lib/services/masterdata"
import { getItems, toggleActiveStatus } from "@/lib/api/master-data"
import { ItemMasterForm } from "@/components/wms/masterdata/ItemMasterForm"
import type { Partner } from "@/lib/types"
import type { ItemDto } from "@/types/master-data"

export default function MasterDataHubPage() {
  // Tab control
  const [activeTab, setActiveTab] = useState("partners")

  // ==========================================
  // PARTNERS (CRM) STATE & LOGIC
  // ==========================================
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnersLoading, setPartnersLoading] = useState(true)
  const [partnerSearch, setPartnerSearch] = useState("")
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false)
  const [partnerFormData, setPartnerFormData] = useState<Partial<Partner>>({
    name: "",
    phone: "",
    address: "",
    city: "",
    isActive: true,
    tenantId: "tenant-1"
  })

  const loadPartners = async () => {
    try {
      setPartnersLoading(true)
      const data = await masterdataService.getPartners(partnerSearch, 1)
      setPartners(data || [])
    } catch (e) {
      toast.error("Không thể tải danh sách đối tác")
    } finally {
      setPartnersLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "partners") {
      loadPartners()
    }
  }, [partnerSearch, activeTab])

  const handleSavePartner = async () => {
    try {
      if (!partnerFormData.name?.trim()) {
        toast.error("Tên đối tác là bắt buộc")
        return
      }
      if (partnerFormData.id) {
        await masterdataService.updatePartner(partnerFormData.id, partnerFormData)
        toast.success(`Cập nhật đối tác "${partnerFormData.name}" thành công!`)
      } else {
        await masterdataService.createPartner(partnerFormData)
        toast.success(`Thêm mới đối tác "${partnerFormData.name}" thành công!`)
      }
      setIsPartnerDialogOpen(false)
      loadPartners()
    } catch (e) {
      toast.error("Lưu thông tin đối tác thất bại")
    }
  }

  const handleDeletePartner = async (id: string, name: string) => {
    try {
      await masterdataService.deactivatePartner(id)
      toast.warning(`Đã ngừng hoạt động đối tác: ${name}`)
      loadPartners()
    } catch (e) {
      toast.error("Ngừng hoạt động đối tác thất bại")
    }
  }

  const openPartnerForm = (p?: Partner) => {
    setPartnerFormData(
      p
        ? { ...p }
        : { name: "", phone: "", address: "", city: "", isActive: true, tenantId: "tenant-1" }
    )
    setIsPartnerDialogOpen(true)
  }

  // ==========================================
  // ITEMS (SKU) STATE & LOGIC
  // ==========================================
  const [items, setItems] = useState<ItemDto[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemSearch, setItemSearch] = useState("")
  const [itemCategoryFilter, setItemCategoryFilter] = useState("all")
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemDto | null>(null)
  const [togglingRows, setTogglingRows] = useState<Record<string, boolean>>({})

  const loadItems = async () => {
    try {
      setItemsLoading(true)
      const data = await getItems()
      setItems(data || [])
    } catch (e) {
      toast.error("Không thể tải danh sách sản phẩm dữ liệu chủ")
    } finally {
      setItemsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === "items") {
      loadItems()
    }
  }, [activeTab])

  const handleToggleItemActive = async (id: string, sku: string, currentStatus: boolean) => {
    try {
      setTogglingRows((prev) => ({ ...prev, [id]: true }))
      const updated = await toggleActiveStatus(id)
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
      if (updated.isActive) {
        toast.success(`Đã kích hoạt hoạt động thành công cho SKU: ${sku}`)
      } else {
        toast.warning(`Đã dừng hoạt động (Khóa) thành công cho SKU: ${sku}`)
      }
    } catch (e: any) {
      toast.error(e.message || "Không thể chuyển đổi trạng thái hoạt động")
    } finally {
      setTogglingRows((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleOpenCreateItem = () => {
    setSelectedItem(null)
    setIsItemFormOpen(true)
  }

  const handleOpenEditItem = (item: ItemDto) => {
    setSelectedItem(item)
    setIsItemFormOpen(true)
  }

  // Client-side items filtering
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.name.toLowerCase().includes(itemSearch.toLowerCase())
    const matchesCategory =
      itemCategoryFilter === "all" || item.category === itemCategoryFilter
    return matchesSearch && matchesCategory
  })

  // SKU metrics
  const totalItems = items.length
  const activeItemsCount = items.filter((i) => i.isActive).length
  const inactiveItemsCount = totalItems - activeItemsCount
  const uniqueCategories = Array.from(new Set(items.map((i) => i.category)))

  // Partners metrics
  const totalPartners = partners.length
  const activePartnersCount = partners.filter((p) => p.isActive).length
  const inactivePartnersCount = totalPartners - activePartnersCount

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Page Header */}
      <div className="bg-muted/40 border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-foreground tracking-tight">
            <Database className="h-5 w-5 text-[#C41E3A]" />
            Quản trị Dữ liệu Chủ (Master Data Dashboard)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cấu hình thực thể lõi, danh mục ngành hàng, thông số kích thước vật lý và đối tác chuỗi cung ứng đồng bộ WMS/OMS.
          </p>
        </div>

        {activeTab === "partners" ? (
          <Button
            size="sm"
            onClick={() => openPartnerForm()}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold h-9 text-xs rounded-md shadow-sm self-start md:self-center"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm mới đối tác
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleOpenCreateItem}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold h-9 text-xs rounded-md shadow-sm self-start md:self-center"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm sản phẩm SKU
          </Button>
        )}
      </div>

      <div className="px-6 flex-1 overflow-y-auto pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <TabsList className="bg-muted/80 border border-muted p-1 rounded-lg">
            <TabsTrigger value="partners" className="text-xs gap-1.5 px-4 py-1.5 rounded-md">
              <Users className="h-3.5 w-3.5" />
              Đối tác & Khách hàng (CRM)
            </TabsTrigger>
            <TabsTrigger value="items" className="text-xs gap-1.5 px-4 py-1.5 rounded-md">
              <Package className="h-3.5 w-3.5" />
              Danh mục SKU (Item Master)
            </TabsTrigger>
          </TabsList>

          {/* ==================================================================== */}
          {/* TAB 1: PARTNERS (CRM) */}
          {/* ==================================================================== */}
          <TabsContent value="partners" className="space-y-4 outline-none">
            {/* Analytics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-500" />
                <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Tổng số đối tác
                  </CardTitle>
                  <Building className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent className="py-1 px-4 pb-3.5">
                  <div className="text-2xl font-black text-foreground">
                    {partnersLoading ? <Skeleton className="h-8 w-16" /> : totalPartners}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Nhà cung ứng / Chủ hàng cấu hình
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Đang hoạt động
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="py-1 px-4 pb-3.5">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {partnersLoading ? <Skeleton className="h-8 w-16" /> : activePartnersCount}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Đang đồng bộ live với Database thực tế
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ngừng hoạt động
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent className="py-1 px-4 pb-3.5">
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {partnersLoading ? <Skeleton className="h-8 w-16" /> : inactivePartnersCount}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Đối tác bị khóa hoặc tạm dừng giao dịch
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-card border border-muted rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm đối tác (Tên, Số ĐT, Thành phố)..."
                  className="pl-9 h-9 rounded-md text-xs bg-background border-muted"
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] rounded-md bg-muted/30 border-muted">
                  Cơ sở dữ liệu: Live SQL Database
                </Badge>
                <Badge variant="outline" className="text-[10px] rounded-md bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Chế độ: Tự động Fallback an toàn
                </Badge>
              </div>
            </div>

            {/* DataTable Grid */}
            <div className="border border-muted bg-card rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-b border-muted">
                    <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36">
                      Mã đối tác (ID)
                    </TableHead>
                    <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28">
                      Mã Tenant
                    </TableHead>
                    <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground">
                      Tên Đối Tác / Khách Hàng
                    </TableHead>
                    <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36">
                      Liên hệ (Phone)
                    </TableHead>
                    <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground">
                      Địa chỉ & Vị trí
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
                  {partnersLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <TableRow key={idx} className="border-b border-muted">
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : partners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground/60" />
                          <p className="font-semibold">Không tìm thấy đối tác nào khớp</p>
                          <p className="text-[10px] text-muted-foreground/80">
                            Thử điều chỉnh từ khóa tìm kiếm hoặc kiểm tra kết nối microservice MasterData.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    partners.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/10 border-b border-muted transition-colors">
                        <TableCell className="text-xs font-bold font-mono text-slate-600 dark:text-slate-400 tracking-wider">
                          {p.id}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-medium">
                          {p.tenantId}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-foreground">
                          {p.name}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-slate-700">
                          {p.phone}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.city ? `${p.address}, ${p.city}` : p.address}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${p.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                            {p.isActive ? "Hoạt động" : "Tạm khóa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPartnerForm(p)}
                              className="h-7 w-7 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-600 transition-colors"
                              title="Chỉnh sửa đối tác"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePartner(p.id, p.name)}
                              className="h-7 w-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                              title="Ngừng hoạt động"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ==================================================================== */}
          {/* TAB 2: ITEM MASTER (SKU) */}
          {/* ==================================================================== */}
          <TabsContent value="items" className="space-y-4 outline-none">
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
                    {itemsLoading ? <Skeleton className="h-8 w-16" /> : totalItems}
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
                    {itemsLoading ? <Skeleton className="h-8 w-16" /> : activeItemsCount}
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
                    {itemsLoading ? <Skeleton className="h-8 w-16" /> : inactiveItemsCount}
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
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                  />
                </div>
                
                {/* Category Select Filter */}
                <Select value={itemCategoryFilter} onValueChange={setItemCategoryFilter}>
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
                  {itemsLoading ? (
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
                        <TableCell className="text-xs font-bold font-mono text-[#C41E3A] tracking-wider uppercase">
                          {item.sku}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground max-w-sm truncate">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="bg-background text-muted-foreground border-muted font-medium text-[10px] rounded-md">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono font-medium">
                          {item.weight.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono text-muted-foreground font-semibold">
                          {item.length} × {item.width} × {item.height}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                            {item.isActive ? "Hoạt động" : "Tạm khóa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditItem(item)}
                              className="h-7 w-7 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-600 transition-colors"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={togglingRows[item.id]}
                              onClick={() => handleToggleItemActive(item.id, item.sku, item.isActive)}
                              className={`h-7 w-7 rounded-md transition-colors ${
                                item.isActive
                                  ? "hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600"
                                  : "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600"
                              }`}
                              title={item.isActive ? "Ngừng hoạt động (Khóa SKU)" : "Kích hoạt hoạt động"}
                            >
                              {item.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sliding Entry Form Overlay for Items */}
      <ItemMasterForm
        isOpen={isItemFormOpen}
        onClose={() => setIsItemFormOpen(false)}
        selectedItem={selectedItem}
        onSuccess={loadItems}
      />

      {/* CRM Dialog Form for Partners */}
      <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-xl shadow-2xl">
          <DialogHeader className="border-b border-muted pb-3">
            <DialogTitle className="text-sm font-extrabold flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-[#C41E3A]" />
              {partnerFormData.id ? "Cập nhật thông tin đối tác" : "Thêm đối tác & Khách hàng mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">
                Tên Đối Tác / Khách Hàng <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="VD: Tổng Công ty Logistics ABC..."
                className="h-9 text-xs bg-background border-muted rounded-md"
                value={partnerFormData.name || ""}
                onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">
                  Số Điện Thoại <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="VD: 0901234567"
                    className="h-9 pl-9 text-xs bg-background border-muted rounded-md"
                    value={partnerFormData.phone || ""}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">
                  Mã Định Danh Tenant <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="VD: T-001"
                    className="h-9 pl-9 text-xs bg-background border-muted rounded-md font-mono"
                    value={partnerFormData.tenantId || ""}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, tenantId: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">
                Địa Chỉ Chi Tiết (Đường, Quận/Huyện)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="VD: 123 Đường Song Hành, Thảo Điền"
                  className="h-9 pl-9 text-xs bg-background border-muted rounded-md"
                  value={partnerFormData.address || ""}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">
                Tỉnh / Thành phố
              </Label>
              <Input
                placeholder="VD: Hồ Chí Minh"
                className="h-9 text-xs bg-background border-muted rounded-md"
                value={partnerFormData.city || ""}
                onChange={(e) => setPartnerFormData({ ...partnerFormData, city: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-muted pt-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs rounded-md"
              onClick={() => setIsPartnerDialogOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white shadow rounded-md"
              onClick={handleSavePartner}
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
