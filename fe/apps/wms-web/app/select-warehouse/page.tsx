"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { getWarehouses, createWarehouse, deleteWarehouse } from "@/lib/api/wms-layout"
import { WarehouseDto } from "@/types/wms-layout"
import { Loader2, Warehouse as WarehouseIcon, MapPin, ArrowRight, Trash2, Plus, X, Check } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { toast } from "sonner"
import { usePermissions } from "@/components/wms/rbac/usePermissions"

export default function SelectWarehousePage() {
  const router = useRouter()
  const { setActiveWarehouseId } = useWarehouseContext()
  const { isSystemAdmin, hasPermissionInAnyWarehouse } = usePermissions()
  const canManageWarehouse = isSystemAdmin || hasPermissionInAnyWarehouse("warehouse:manage")
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Edit & creation states
  const [isEditMode, setIsEditMode] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [whForm, setWhForm] = useState({ name: "", code: "", locationText: "" })
  const [isCreating, setIsCreating] = useState(false)

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const data = await getWarehouses(false) // Fetches based on permissions
      setWarehouses(data || [])
      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch warehouses", err)
      setError("Không thể tải danh sách kho. Vui lòng thử lại sau.")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [router, setActiveWarehouseId])

  const handleSelect = (id: string) => {
    if (isEditMode) return // Don't select in edit mode
    setIsNavigating(true)
    setActiveWarehouseId(id)
    router.push("/wms")
  }

  const handleCreate = async () => {
    if (!whForm.name || !whForm.code) {
      toast.error("Vui lòng nhập đầy đủ tên và mã kho.")
      return
    }
    setIsCreating(true)
    try {
      await createWarehouse(whForm)
      toast.success("Thêm kho mới thành công!")
      setCreateOpen(false)
      setWhForm({ name: "", code: "", locationText: "" })
      await fetchWarehouses()
    } catch (err) {
      console.error(err)
      toast.error("Không thể tạo kho mới. Mã kho có thể đã bị trùng.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kho "${name}"? Hành động này sẽ xóa các block, zone, bin liên quan và không thể hoàn tác.`)) {
      return
    }
    try {
      await deleteWarehouse(id)
      toast.success("Xóa kho thành công!")
      // Remove deleted warehouse from local state immediately to refresh UI
      setWarehouses(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      console.error(err)
      toast.error("Không thể xóa kho. Vui lòng thử lại sau.")
    }
  }

  if (loading || isNavigating) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C41E3A]" />
        {isNavigating && <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang chuyển vào hệ thống...</p>}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-rose-500 font-medium">{error}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C41E3A] to-[#A01830] text-white shadow-xl shadow-[#C41E3A]/20 mb-6">
          <WarehouseIcon className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">Chọn Kho Làm Việc</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Tài khoản của bạn có quyền truy cập ở nhiều kho. Vui lòng chọn kho mà bạn muốn thao tác để tiếp tục.
        </p>
        {canManageWarehouse && (
          <div className="mt-6 flex justify-center gap-3">
            <Button 
              onClick={() => {
                setIsEditMode(!isEditMode)
              }} 
              variant={isEditMode ? "default" : "outline"}
              className={isEditMode 
                ? "bg-[#C41E3A] hover:bg-[#A01830] text-white text-xs h-9 rounded-lg px-5 font-semibold transition-all"
                : "border-[#C41E3A] text-[#C41E3A] hover:bg-[#C41E3A] hover:text-white text-xs h-9 rounded-lg px-5 font-semibold transition-all"
              }
            >
              {isEditMode ? (
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> Hoàn tất</span>
              ) : (
                "Thêm / Xóa kho"
              )}
            </Button>

            {isEditMode && (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-lg px-5 font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Thêm kho mới
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-bold flex items-center gap-2">
                      <WarehouseIcon className="h-5 w-5 text-[#C41E3A]" /> Thêm Kho Mới
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Tên kho</Label>
                      <Input 
                        placeholder="Ví dụ: Hanoi Central Warehouse" 
                        className="h-9 text-xs" 
                        value={whForm.name} 
                        onChange={e => setWhForm({ ...whForm, name: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Mã kho (Code)</Label>
                      <Input 
                        placeholder="Ví dụ: WH-HN-001" 
                        className="h-9 text-xs font-mono uppercase" 
                        value={whForm.code} 
                        onChange={e => setWhForm({ ...whForm, code: e.target.value.toUpperCase() })} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Địa chỉ</Label>
                      <Input 
                        placeholder="Địa chỉ cụ thể" 
                        className="h-9 text-xs" 
                        value={whForm.locationText} 
                        onChange={e => setWhForm({ ...whForm, locationText: e.target.value })} 
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setCreateOpen(false)}
                        className="h-9 text-xs"
                        disabled={isCreating}
                      >
                        Hủy
                      </Button>
                      <Button 
                        onClick={handleCreate}
                        className="bg-[#C41E3A] hover:bg-[#A01830] text-white h-9 text-xs"
                        disabled={isCreating}
                      >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm mới"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 text-center py-12 border border-dashed rounded-2xl bg-card">
          <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
            <WarehouseIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">Không tìm thấy kho</h2>
          <p className="text-muted-foreground max-w-md text-sm px-6">
            Hệ thống chưa có kho nào hoặc tài khoản chưa được phân quyền. 
            {isEditMode && canManageWarehouse ? "Hãy click nút 'Thêm kho mới' ở trên để bắt đầu." : "Liên hệ quản trị viên để biết thêm chi tiết."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {warehouses.map((wh) => (
            <div 
              key={wh.id}
              onClick={() => handleSelect(wh.id)}
              className={`group relative flex flex-col bg-card border rounded-2xl p-6 shadow-sm transition-all duration-300 overflow-hidden ${
                isEditMode && canManageWarehouse
                  ? "border-amber-500/40 hover:border-rose-500/50 cursor-default" 
                  : "border-border/50 hover:shadow-xl hover:border-[#C41E3A]/40 hover:-translate-y-1 cursor-pointer"
              }`}
            >
              <div className="absolute top-0 right-0 p-4 transition-opacity duration-300">
                {isEditMode && canManageWarehouse ? (
                  <button 
                    onClick={(e) => handleDelete(wh.id, wh.name, e)}
                    className="h-8 w-8 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center border border-rose-200 transition-colors shadow-sm"
                    title="Xóa kho"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </button>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#C41E3A]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-[#C41E3A]" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mb-4 pr-6">
                <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center transition-colors duration-300 ${
                  !(isEditMode && canManageWarehouse) && "group-hover:bg-[#C41E3A]/5"
                }`}>
                  <WarehouseIcon className={`h-6 w-6 text-muted-foreground transition-colors duration-300 ${
                    !(isEditMode && canManageWarehouse) && "group-hover:text-[#C41E3A]"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base text-card-foreground truncate transition-colors duration-300 ${
                    !isEditMode && "group-hover:text-[#C41E3A]"
                  }`}>
                    {wh.name}
                  </h3>
                  <span className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground mt-1">
                    {wh.code}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 mt-auto pt-4 border-t border-border/50">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {wh.locationText || "Chưa cập nhật địa chỉ"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
