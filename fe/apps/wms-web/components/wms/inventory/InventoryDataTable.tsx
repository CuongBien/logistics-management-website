"use client"

import { useState } from "react"
import { InventoryItemDto } from "@/types/wms-inventory"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Badge } from "@repo/ui/components/badge"
import { Input } from "@repo/ui/components/input"
import { ReserveActionsDropdown } from "./ReserveActionsDropdown"
import { Search, MapPin, AlertCircle, Sparkles, FilterX, Boxes } from "lucide-react"

interface InventoryDataTableProps {
  data: InventoryItemDto[]
  onAction: (action: 'transfer' | 'reconcile' | 'reserve' | 'release', item: InventoryItemDto) => void
}

export function InventoryDataTable({ data, onAction }: InventoryDataTableProps) {
  const [skuSearch, setSkuSearch] = useState("")
  const [binSearch, setBinSearch] = useState("")
  const [warehouseSearch, setWarehouseSearch] = useState("")

  const filteredData = data.filter(item => {
    const matchSku = item.sku.toLowerCase().includes(skuSearch.toLowerCase())
    const matchBin = item.binCode.toLowerCase().includes(binSearch.toLowerCase())
    const matchWarehouse = 
      (item.warehouseCode || "").toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      (item.warehouseName || "").toLowerCase().includes(warehouseSearch.toLowerCase())
    return matchSku && matchBin && matchWarehouse
  })

  // Format Tenant helper
  const formatTenant = (tenant: string) => {
    switch (tenant) {
      case 'tenant-shopee': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold">Shopee</Badge>;
      case 'tenant-lazada': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold">Lazada</Badge>;
      case 'tenant-tiktok': return <Badge variant="outline" className="bg-zinc-800 text-white font-bold dark:bg-zinc-700">TikTok</Badge>;
      default: return <Badge variant="outline">{tenant}</Badge>;
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-muted p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã SKU sản phẩm..."
            className="pl-10 bg-background"
            value={skuSearch}
            onChange={(e) => setSkuSearch(e.target.value)}
          />
        </div>
        <div className="relative flex-1 w-full">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo vị trí ô kệ (Bin)..."
            className="pl-10 bg-background"
            value={binSearch}
            onChange={(e) => setBinSearch(e.target.value)}
          />
        </div>
        <div className="relative flex-1 w-full">
          <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo kho hàng (Code/Tên)..."
            className="pl-10 bg-background"
            value={warehouseSearch}
            onChange={(e) => setWarehouseSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="border border-muted rounded-xl overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Chủ hàng (Tenant)</TableHead>
              <TableHead className="font-bold">Kho Hàng</TableHead>
              <TableHead className="font-bold">Mã SKU</TableHead>
              <TableHead className="font-bold">Vị Trí (Bin)</TableHead>
              <TableHead className="font-bold text-center">Lô Hàng (Lot)</TableHead>
              <TableHead className="font-bold text-right">Tồn Vật Lý (On Hand)</TableHead>
              <TableHead className="font-bold text-right text-indigo-600 dark:text-indigo-400">Khả Dụng (Available)</TableHead>
              <TableHead className="font-bold text-right text-rose-500">Đã Giữ (Reserved)</TableHead>
              <TableHead className="font-bold text-center w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => {
              const reservedQty = item.quantityOnHand - item.availableQuantity
              const isOutOfStock = item.availableQuantity === 0

              return (
                <TableRow 
                  key={item.id} 
                  className={`hover:bg-muted/15 transition-colors ${isOutOfStock ? "bg-rose-500/5 dark:bg-rose-500/10" : ""}`}
                >
                  {/* Tenant */}
                  <TableCell className="align-middle py-3.5">
                    {formatTenant(item.tenantId)}
                  </TableCell>

                  {/* Warehouse */}
                  <TableCell className="align-middle py-3.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{item.warehouseCode}</span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[150px]" title={item.warehouseName}>
                        {item.warehouseName}
                      </span>
                    </div>
                  </TableCell>

                  {/* SKU */}
                  <TableCell className="font-semibold align-middle font-mono text-sm py-3.5">
                    {item.sku}
                  </TableCell>

                  {/* Bin */}
                  <TableCell className="align-middle py-3.5">
                    <span className="inline-flex items-center gap-1.5 font-bold font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <MapPin className="h-3 w-3" />
                      {item.binCode}
                    </span>
                  </TableCell>

                  {/* Lot No */}
                  <TableCell className="align-middle text-center font-mono text-xs text-muted-foreground py-3.5">
                    {item.lotNo || "—"}
                  </TableCell>

                  {/* Physical Qty */}
                  <TableCell className="align-middle text-right font-bold font-mono py-3.5">
                    {item.quantityOnHand.toLocaleString()}
                  </TableCell>

                  {/* Available Qty */}
                  <TableCell className="align-middle text-right font-extrabold font-mono py-3.5">
                    {isOutOfStock ? (
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-extrabold gap-1 flex items-center justify-center float-right select-none animate-pulse">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        Hết Hàng
                      </Badge>
                    ) : (
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {item.availableQuantity.toLocaleString()}
                      </span>
                    )}
                  </TableCell>

                  {/* Reserved Qty */}
                  <TableCell className="align-middle text-right font-bold font-mono py-3.5">
                    {reservedQty > 0 ? (
                      <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded font-extrabold">
                        {reservedQty.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-medium">0</span>
                    )}
                  </TableCell>

                  {/* Action Dropdown */}
                  <TableCell className="align-middle text-center py-3.5">
                    <ReserveActionsDropdown item={item} onAction={onAction} />
                  </TableCell>
                </TableRow>
              )
            })}

            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center py-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FilterX className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Không tìm thấy bản ghi tồn kho nào khớp bộ lọc.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
