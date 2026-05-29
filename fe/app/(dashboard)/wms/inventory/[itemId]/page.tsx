"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { InventoryItemDto, InventoryLedgerDto } from "@/types/wms-inventory"
import { getInventoryItem, getItemLedgers } from "@/lib/api/wms-inventory"
import { LedgerHistoryTable } from "@/components/wms/inventory/LedgerHistoryTable"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Package, MapPin, Layers, Calendar, AlertCircle } from "lucide-react"
import { format } from "date-fns"

export default function LedgerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.itemId as string

  const [item, setItem] = useState<InventoryItemDto | null>(null)
  const [ledgers, setLedgers] = useState<InventoryLedgerDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!itemId) return
      setIsLoading(true)
      try {
        const [itemData, ledgerData] = await Promise.all([
          getInventoryItem(itemId),
          getItemLedgers(itemId)
        ])
        if (itemData) {
          setItem(itemData)
          setLedgers(ledgerData)
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu sổ cái", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [itemId])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-card/20 min-h-[300px] space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <div>
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy lô hàng</h3>
          <p className="text-muted-foreground text-sm mt-1">Mã ID tồn kho này không khả dụng hoặc đã bị loại bỏ khỏi hệ thống.</p>
        </div>
        <Button onClick={() => router.push('/wms/inventory')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const formatTenant = (tenant: string) => {
    switch (tenant) {
      case 'tenant-shopee': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold">Shopee</Badge>;
      case 'tenant-lazada': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold">Lazada</Badge>;
      case 'tenant-tiktok': return <Badge variant="outline" className="bg-zinc-800 text-white font-bold dark:bg-zinc-700">TikTok</Badge>;
      default: return <Badge variant="outline">{tenant}</Badge>;
    }
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Detail Page Header */}
      <div className="flex items-center gap-4 border-b border-muted pb-5">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push('/wms/inventory')}
          className="shrink-0 h-9 w-9 border-muted hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Chi Tiết Sổ Cái Tồn Kho (Ledger History)
            </h1>
            {formatTenant(item.tenantId)}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Xem lịch sử chi tiết mọi biến động nhập, xuất, luân chuyển và cân bằng của sản phẩm.
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Stock Card Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-muted relative overflow-hidden bg-card shadow-sm">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-indigo-500" />
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-500" />
                Thông Tin Lô Hàng
              </CardTitle>
              <CardDescription>
                Thông tin định danh vật lý của sản phẩm trong kho.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              {/* SKU */}
              <div>
                <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                  Mã SKU Sản phẩm
                </span>
                <span className="font-mono text-base font-extrabold text-foreground">{item.sku}</span>
              </div>

              {/* Bin Location */}
              <div>
                <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                  Vị trí ô kệ (Bin Code)
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold font-mono text-sm px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {item.binCode}
                </span>
              </div>

              {/* Lot Number */}
              <div>
                <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                  Số Lô Sản Xuất (LotNo)
                </span>
                <span className="font-mono text-sm font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                  {item.lotNo || "Không áp dụng Lô"}
                </span>
              </div>

              {/* Expiry Date */}
              {item.expiryDate && (
                <div>
                  <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                    Hạn Sử Dụng (Expiry)
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(item.expiryDate), "dd/MM/yyyy")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quantity Statistics Card */}
          <Card className="border-muted relative overflow-hidden bg-card shadow-sm">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-blue-500" />
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                Số Lượng Hiện Tại
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Tồn Vật Lý (On Hand):</span>
                <span className="font-bold font-mono text-base">{item.quantityOnHand.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground text-indigo-600 dark:text-indigo-400">Khả Dụng (Available):</span>
                <span className="font-extrabold font-mono text-base text-indigo-600 dark:text-indigo-400">{item.availableQuantity.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-rose-500">Đang bảo lưu (Reserved):</span>
                <span className="font-bold font-mono text-base text-rose-500">
                  {(item.quantityOnHand - item.availableQuantity).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Ledger History Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Lịch Sử Thay Đổi Số Lượng</h3>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
              Tổng số {ledgers.length} giao dịch
            </span>
          </div>
          <LedgerHistoryTable ledgers={ledgers} />
        </div>
      </div>
    </div>
  )
}
