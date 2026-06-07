"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  Scan, Search, QrCode, ClipboardList, Package, MapPin, Truck, RefreshCw, 
  AlertCircle, CheckCircle2, XCircle, ArrowRight, Database, History, 
  Volume2, VolumeX, Eye, Download, Info, Tag, Calendar, AlertTriangle, Layers
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Badge } from "@repo/ui/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Progress } from "@repo/ui/components/progress"
import { toast } from "sonner"
import * as qrService from "@/lib/services/qrcode"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

// Define history log interface
interface ScanLog {
  id: string
  timestamp: string
  rawValue: string
  type: string
  status: "success" | "error"
  message: string
}

export default function QrScannerPage() {
  // Sound & Input State
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const [activeTab, setActiveTab] = useState("lookup") // lookup | actions
  const [activeAction, setActiveAction] = useState("scan-receive") // c1 - c11
  const [isLoading, setIsLoading] = useState(false)
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([])
  
  // Selected Context (e.g. selected outbound order, inbound receipt, etc.)
  const [contextId, setContextId] = useState("")
  const [scannedResult, setScannedResult] = useState<any>(null)
  const [actionResponse, setActionResponse] = useState<any>(null)

  // Verify Pack Local Tracking State
  const [verifyPackItems, setVerifyPackItems] = useState<any[]>([])
  const [verifyPackComplete, setVerifyPackComplete] = useState(false)
  const [verifyPackOrderNo, setVerifyPackOrderNo] = useState("")

  // Context input fields state for Actions
  const { activeWarehouseId } = useWarehouseContext()
  const [lotNo, setLotNo] = useState("")
  const [binCode, setBinCode] = useState("BIN-DOCK-01")
  const [expiryDate, setExpiryDate] = useState("")
  const [qtyInput, setQtyInput] = useState(1)
  const [warehouseIdInput, setWarehouseIdInput] = useState(activeWarehouseId || "")
  
  // Dialog state for printable QR code
  const [printQrUrl, setPrintQrUrl] = useState<string | null>(null)
  const [printQrTitle, setPrintQrTitle] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)

  // Load URL search parameters on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const contextIdParam = params.get("contextId") || params.get("receiptId") || params.get("outboundOrderId") || params.get("taskId")
      const tabParam = params.get("tab")
      const actionParam = params.get("action")
      
      if (contextIdParam) setContextId(contextIdParam)
      if (tabParam) setActiveTab(tabParam)
      if (actionParam) setActiveAction(actionParam)
    }
  }, [])

  // Auto focus input once on page load
  useEffect(() => {
    focusInput()
  }, [])

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Synthesize scan beep using Web Audio API (no external file dependency)
  const playBeep = (type: "success" | "error" | "complete") => {
    if (!soundEnabled) return
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      
      if (type === "success") {
        // Double high chirp
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.frequency.setValueAtTime(800, ctx.currentTime)
        gain1.gain.setValueAtTime(0.1, ctx.currentTime)
        osc1.start()
        osc1.stop(ctx.currentTime + 0.08)
        
        setTimeout(() => {
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.connect(gain2)
          gain2.connect(ctx.destination)
          osc2.frequency.setValueAtTime(1050, ctx.currentTime)
          gain2.gain.setValueAtTime(0.1, ctx.currentTime)
          osc2.start()
          osc2.stop(ctx.currentTime + 0.1)
        }, 80)
      } else if (type === "complete") {
        // Triple happy sound
        [600, 800, 1200].forEach((freq, index) => {
          setTimeout(() => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.setValueAtTime(freq, ctx.currentTime)
            gain.gain.setValueAtTime(0.1, ctx.currentTime)
            osc.start()
            osc.stop(ctx.currentTime + 0.12)
          }, index * 100)
        })
      } else {
        // Low error drone
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(150, ctx.currentTime)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        osc.start()
        osc.stop(ctx.currentTime + 0.45)
      }
    } catch (e) {
      console.warn("AudioContext failed to play sound", e)
    }
  }

  // Handle Scan Submission
  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const value = inputValue.trim()
    if (!value) return

    setInputValue("") // Clear immediately for next scan
    setIsLoading(true)
    
    try {
      if (activeTab === "lookup") {
        await executeLookup(value)
      } else {
        await executeAction(value)
      }
    } catch (err: any) {
      console.error(err)
      playBeep("error")
      const errMsg = err.body?.message || err.message || "Đã xảy ra lỗi khi quét."
      toast.error(errMsg)
      addHistoryLog(value, "UNKNOWN", "error", errMsg)
    } finally {
      setIsLoading(false)
      focusInput()
    }
  }

  // Core Lookup Logic (Nhóm B)
  const executeLookup = async (rawValue: string) => {
    // 1. Parse via central API (B1)
    const parsed = await qrService.parseQrCode({ rawValue })
    
    if (parsed.type === "UNKNOWN" || !parsed.entityId) {
      // Direct lookup fallback if parsed data is minimal (e.g. SKU has no entityId)
      if (parsed.type === "SKU" && parsed.data?.skuCode) {
        const skuDetails = await qrService.lookupSku(parsed.data.skuCode)
        setScannedResult({ type: "SKU", entityId: parsed.data.skuCode, data: skuDetails })
        playBeep("success")
        toast.success(`Đã tìm thấy SKU: ${parsed.data.skuCode}`)
        addHistoryLog(rawValue, "SKU", "success", `Tra cứu thông tin SKU ${parsed.data.skuCode}`)
        return
      }
      playBeep("error")
      toast.error("Không nhận dạng được định dạng QR Code!")
      addHistoryLog(rawValue, "UNKNOWN", "error", "Không nhận dạng được định dạng QR Code")
      setScannedResult(null)
      return
    }

    // 2. Fetch specific entity details (B2 - B5)
    let details: any = null
    const type = parsed.type
    const entityId = parsed.entityId

    switch (type) {
      case "BIN":
        details = await qrService.lookupBin(entityId)
        break
      case "ORDER":
      case "OUTBOUND_ORDER":
        details = await qrService.lookupOrder(entityId)
        break
      case "SHIPMENT":
        details = await qrService.lookupShipment(entityId)
        break
      case "RECEIPT":
        // Fallback receipt details from parsed data
        details = parsed.data
        break
      default:
        details = parsed.data
    }

    setScannedResult({ type, entityId, data: details || parsed.data })
    playBeep("success")
    toast.success(`Tra cứu thành công: ${type}`)
    addHistoryLog(rawValue, type, "success", `Tra cứu thực thể [${type}] có ID: ${entityId}`)
  }

  // Core Action Logic (Nhóm C)
  const executeAction = async (rawValue: string) => {
    let res: any = null
    const code = rawValue.trim()

    // 1. Intercept Document QR codes to automatically select the context ID
    const parsedInit = await qrService.parseQrCode({ rawValue })
    const isReceiptCode = parsedInit.type === "RECEIPT" || 
                          code.toUpperCase().startsWith("RCV:") || 
                          code.toLowerCase().startsWith("rcv-") || 
                          code.toLowerCase().startsWith("receipt-");
    
    if (isReceiptCode && activeAction === "scan-receive") {
      const receiptId = parsedInit.entityId || code.replace(/RCV:|receipt-/i, "")
      setContextId(receiptId)
      playBeep("success")
      toast.success(`Đã chọn Phiếu Nhập: ${receiptId}`)
      addHistoryLog(rawValue, "RECEIPT", "success", `Chọn phiếu nhập ${receiptId}`)
      return
    }

    const isOrderCode = parsedInit.type === "OUTBOUND_ORDER" || 
                        parsedInit.type === "ORDER" || 
                        code.toUpperCase().startsWith("OB:") || 
                        code.toUpperCase().startsWith("ORD:") || 
                        code.toLowerCase().startsWith("ob-") || 
                        code.toLowerCase().startsWith("ord-") || 
                        code.toLowerCase().startsWith("order-");
                        
    if (isOrderCode && activeAction === "verify-pack") {
      const orderId = parsedInit.entityId || code.replace(/OB:|ORD:|order-/i, "")
      setContextId(orderId)
      playBeep("success")
      toast.success(`Đã chọn Đơn Xuất Kho: ${orderId}`)
      addHistoryLog(rawValue, "OUTBOUND_ORDER", "success", `Chọn đơn xuất kho ${orderId}`)
      return
    }

    switch (activeAction) {
      // C1: Scan SKU + Bin -> Receive Item into Inbound Receipt
      case "scan-receive": {
        if (!contextId) {
          toast.warning("Vui lòng nhập ID Phiếu Nhập (Receipt ID) trước khi quét!")
          playBeep("error")
          return
        }
        // Deduce SKU or Bin from QR code
        const parsed = await qrService.parseQrCode({ rawValue })
        const payloadVal = parsed.isValid ? parsed.Value : code

        if (parsed.type === "BIN" || payloadVal.startsWith("BIN:")) {
          const cleanBin = parsed.type === "BIN" ? (parsed.entityId || payloadVal.replace("BIN:", "")) : (payloadVal.startsWith("BIN:") ? payloadVal.substring(4) : payloadVal)
          setBinCode(cleanBin)
          toast.info(`Đã quét mã Bin: ${cleanBin}`)
          addHistoryLog(rawValue, "BIN", "success", `Ghi nhận mã Bin: ${cleanBin}`)
          setInputValue("") // Clear input so they can scan SKU next
          return
        }

        // Assume it's SKU
        res = await qrService.scanReceive({
          receiptId: contextId,
          scannedSku: rawValue,
          scannedBin: binCode || "BIN-DOCK-01",
          quantity: qtyInput,
          lotNo: lotNo || "LOT-DEFAULT",
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep("success")
        toast.success(`Nhận hàng SKU ${res.lineProgress?.sku} thành công!`)
        addHistoryLog(rawValue, "RECEIVE", "success", `Nhận ${qtyInput} SKU ${res.lineProgress?.sku} vào kệ`)
        break
      }

      // C2: Confirm Putaway (Scan Bin Đích)
      case "confirm-putaway": {
        if (!contextId) {
          toast.warning("Vui lòng nhập Task ID cất hàng!")
          playBeep("error")
          return
        }
        res = await qrService.confirmPutaway({
          taskId: contextId,
          scannedBin: rawValue
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep("success")
        toast.success("Xác nhận cất hàng lên kệ thành công!")
        addHistoryLog(rawValue, "PUTAWAY", "success", `Task ${contextId} đã cất vào kệ ${res.actualBinCode}`)
        break
      }

      // C3: Confirm Crossdock (Scan Bin OUT)
      case "confirm-crossdock": {
        if (!contextId) {
          toast.warning("Vui lòng nhập Task ID Cross-dock!")
          playBeep("error")
          return
        }
        res = await qrService.confirmCrossDock({
          taskId: contextId,
          scannedBin: rawValue
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep("success")
        toast.success("Xác nhận chuyển thẳng (Crossdock) thành công!")
        addHistoryLog(rawValue, "CROSSDOCK", "success", `Task Crossdock ${contextId} hoàn tất`)
        break
      }

      // C4: Transit Receive (Scan Kiện trung chuyển)
      case "transit-receive": {
        res = await qrService.transitReceive({
          scannedOrder: rawValue,
          warehouseId: warehouseIdInput
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep(res.discrepancy?.hasDiscrepancy ? "error" : "success")
        if (res.discrepancy?.hasDiscrepancy) {
          toast.warning("Đã phát hiện sai lệch số lượng trung chuyển!")
        } else {
          toast.success("Nhận kiện trung chuyển thành công!")
        }
        addHistoryLog(rawValue, "TRANSIT", "success", `Quét nhận kiện trung chuyển. Kết quả: ${res.nextAction}`)
        break
      }

      // C5: Confirm Pick
      case "confirm-pick": {
        if (!contextId) {
          toast.warning("Vui lòng nhập Pick Task ID!")
          playBeep("error")
          return
        }
        // Format requires scan SKU and Bin. Simple scanner page takes SKU from scanned code.
        const parsed = await qrService.parseQrCode({ rawValue })
        const skuVal = parsed.type === "SKU" ? parsed.data.skuCode : rawValue
        
        res = await qrService.confirmPick({
          pickTaskId: contextId,
          scannedBin: binCode || "BIN-A01-01",
          scannedSku: skuVal
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep("success")
        toast.success(`Đã lấy thành công ${res.quantity} sản phẩm SKU ${res.sku}`)
        addHistoryLog(rawValue, "PICK", "success", `Lấy hàng hoàn tất cho Task: ${contextId}`)
        break
      }

      // C6: Verify Pack (Scan SKU đóng gói)
      case "verify-pack": {
        if (!contextId) {
          toast.warning("Vui lòng nhập Outbound Order ID!")
          playBeep("error")
          return
        }
        res = await qrService.verifyPack({
          outboundOrderId: contextId,
          scannedSku: rawValue,
          quantity: qtyInput
        })
        setActionResponse({ action: activeAction, data: res })
        setVerifyPackItems(res.verifiedItems || [])
        setVerifyPackOrderNo(res.orderNo)
        
        if (res.allItemsVerified) {
          setVerifyPackComplete(true)
          playBeep("complete")
          toast.success("Xác thực đóng gói hoàn tất! Toàn bộ sản phẩm đã được quét.", { duration: 5000 })
        } else {
          playBeep("success")
          toast.info(`Đã quét SKU: ${rawValue}. Vui lòng quét các sản phẩm còn lại.`)
        }
        addHistoryLog(rawValue, "VERIFY_PACK", "success", `Quét đóng gói SKU ${rawValue} (đơn ${res.orderNo})`)
        break
      }

      // C7: Scan Sort (Gom đơn vào Shipment)
      case "scan-sort": {
        res = await qrService.scanSort({
          scannedOrder: rawValue,
          destinationWarehouseId: warehouseIdInput || undefined
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep("success")
        toast.success(`Đơn ${res.waybillCode} đã được chia vào lô ${res.shipment?.shipmentNo}!`)
        addHistoryLog(rawValue, "SORT", "success", `Chia đơn ${res.waybillCode} vào Shipment: ${res.shipment?.shipmentNo}`)
        break
      }

      // C8: Scan Load (Lên xe)
      case "scan-load": {
        res = await qrService.scanLoad({
          scannedOrder: rawValue,
          shipmentId: contextId || undefined
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep("success")
        toast.success(`Đã xếp đơn ${res.orderNo} lên xe thành công!`)
        addHistoryLog(rawValue, "LOAD", "success", `Xếp đơn ${res.orderNo} lên xe`)
        break
      }

      // C9: Ship & Release (Xuất kho & Giải phóng ô kệ)
      case "ship-and-release": {
        res = await qrService.shipAndRelease({
          scannedOrder: rawValue,
          shipmentId: contextId || undefined
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep("success")
        toast.success(`Đã xuất kho thành công! Giải phóng kệ: ${res.releasedBinCodes?.join(", ")}`)
        addHistoryLog(rawValue, "SHIP_RELEASE", "success", `Xuất đơn ${res.orderNo}. Giải phóng ${res.releasedBinCodes?.length} kệ.`)
        break
      }

      // C10: Cycle Count Start
      case "cycle-count-start": {
        if (!contextId) {
          toast.warning("Vui lòng nhập Task ID kiểm kho!")
          playBeep("error")
          return
        }
        res = await qrService.cycleCountStart({
          countTaskId: contextId,
          scannedBin: rawValue
        })
        setActionResponse({ action: activeAction, data: res })
        playBeep("success")
        toast.success(`Xác nhận đúng kệ ${res.binCode}. SKU kiểm kê: ${res.sku}`)
        addHistoryLog(rawValue, "COUNT_START", "success", `Bắt đầu kiểm kê tại kệ ${res.binCode}`)
        break
      }

      // C11: Confirm Replenish
      case "confirm-replenish": {
        if (!contextId) {
          toast.warning("Vui lòng nhập Task ID bổ sung hàng!")
          playBeep("error")
          return
        }
        // Replenish requires scan of both source and destination bin.
        // We temporarily store source bin in lotNo.
        if (!lotNo) {
          setLotNo(rawValue)
          playBeep("success")
          toast.info(`Ghi nhận Bin nguồn: ${rawValue}. Vui lòng quét tiếp Bin đích.`)
          addHistoryLog(rawValue, "REPLENISH_SRC", "success", `Quét Bin nguồn: ${rawValue}`)
          return
        }
        
        res = await qrService.confirmReplenish({
          taskId: contextId,
          scannedSourceBin: lotNo,
          scannedDestBin: rawValue
        })
        setActionResponse({ action: activeAction, data: res })
        setLotNo("") // Reset
        playBeep("success")
        toast.success(`Bổ sung ${res.requestedQty} SKU ${res.sku} thành công!`)
        addHistoryLog(rawValue, "REPLENISH_COMPLETE", "success", `Hoàn tất chuyển hàng ${res.sku} từ kệ ${res.sourceBin} sang ${res.destBin}`)
        break
      }

      default:
        toast.error("Nghiệp vụ không hợp lệ.")
    }
  }

  // Add items to local logs
  const addHistoryLog = (rawValue: string, type: string, status: "success" | "error", message: string) => {
    const newLog: ScanLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString("vi-VN"),
      rawValue,
      type,
      status,
      message
    }
    setScanHistory(prev => [newLog, ...prev.slice(0, 19)])
  }



  // Load Printable QR Code
  const loadPrintQr = async (type: any, id: string, title: string) => {
    try {
      const url = await qrService.getQrImageUrl(type, id)
      setPrintQrUrl(url)
      setPrintQrTitle(title)
    } catch (e) {
      toast.error("Không thể sinh ảnh QR Code.")
    }
  }

  // Print function
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

  // Verify Pack completion handler
  const handleCompleteVerifyPack = async () => {
    setIsLoading(true)
    try {
      // Pack the outbound order (delegate to manual pack flow backend)
      await fetch(`/api/wms/outbound/orders/${contextId}/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      
      toast.success(`Xác nhận hoàn tất và đóng gói đơn ${verifyPackOrderNo} thành công!`)
      // Load outbound order QR code for printing
      await loadPrintQr("outbound-order", contextId, `Đơn xuất: ${verifyPackOrderNo}`)
      
      // Reset Verify Pack states
      setVerifyPackComplete(false)
      setVerifyPackItems([])
      setVerifyPackOrderNo("")
      setContextId("")
      setActionResponse(null)
    } catch (e: any) {
      toast.error("Có lỗi xảy ra khi đóng gói đơn xuất.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans">
      
      {/* Top Banner Status */}
      <div className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="bg-[#C41E3A] text-white p-1.5 rounded-lg">
            <Scan className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide uppercase">WMS Scanner Hub</h1>
            <p className="text-[10px] text-muted-foreground">Thiết bị Quét Trung tâm WMS/OMS</p>
          </div>
        </div>

        {/* Pulse & Status indicators */}
        <div className="flex items-center gap-4">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] gap-1 px-2 py-0.5 animate-pulse font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 block"></span>
            LIVE READY
          </Badge>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Tắt âm thanh bíp" : "Bật âm thanh bíp"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-12 gap-4 p-4">
        
        {/* Left Side: Scanner Input Area (xl:col-span-5) */}
        <div className="xl:col-span-5 flex flex-col gap-4 overflow-y-auto">
          
          {/* Virtual Terminal Input */}
          <Card className="border-border bg-card/70 backdrop-blur shadow-lg relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C41E3A]" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-[#C41E3A]" />
                Cổng Nhận Quét Mã QR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleScanSubmit} className="space-y-3">
                <div className="relative">
                  <Input 
                    ref={inputRef}
                    className="bg-background border-input focus-visible:border-[#C41E3A] focus-visible:ring-[#C41E3A]/30 text-foreground font-mono text-base h-12 pl-10 pr-4 rounded-xl placeholder:text-muted-foreground/45 placeholder:italic"
                    placeholder="Quét mã bằng súng quét hoặc nhập tay tại đây..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    disabled={isLoading}
                  />
                  <QrCode className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/60 animate-pulse" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-[#C41E3A] hover:bg-[#a01830] text-white font-bold h-10 rounded-xl">
                  {isLoading ? "Đang xử lý mã..." : "Gửi Mã (Enter)"}
                </Button>
              </form>

              {/* Mode switch */}
              <Tabs value={activeTab} onValueChange={val => { setActiveTab(val); setScannedResult(null); setActionResponse(null); }} className="w-full">
                <TabsList className="grid grid-cols-2 bg-muted p-1 border border-border rounded-lg h-9">
                  <TabsTrigger value="lookup" className="text-xs h-7 data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white">
                    <Search className="h-3.5 w-3.5 mr-1" />
                    Tra Cứu QR
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="text-xs h-7 data-[state=active]:bg-[#C41E3A] data-[state=active]:text-white">
                    <ClipboardList className="h-3.5 w-3.5 mr-1" />
                    Nghiệp Vụ Quét
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Context Options panel (Only shown when Actions is active) */}
          {activeTab === "actions" && (
            <Card className="border-border bg-card/70 backdrop-blur shrink-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Cấu Hình Lệnh Quét</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-foreground/90">Chọn nghiệp vụ thực hiện</Label>
                  <select 
                    className="w-full bg-background border border-input rounded-lg h-9 text-xs px-2 text-foreground focus:border-[#C41E3A] focus:outline-none"
                    value={activeAction}
                    onChange={e => { setActiveAction(e.target.value); setActionResponse(null); setVerifyPackItems([]); setContextId(""); setLotNo(""); }}
                  >
                    <option value="scan-receive">C1: Nhận hàng Phiếu Nhập (Inbound Scan Receive)</option>
                    <option value="confirm-putaway">C2: Xác nhận Cất Hàng (Confirm Putaway)</option>
                    <option value="confirm-crossdock">C3: Xác nhận Crossdock (Confirm Crossdock)</option>
                    <option value="transit-receive">C4: Nhận kiện Trung Chuyển (Transit Receive)</option>
                    <option value="confirm-pick">C5: Xác nhận Lấy Hàng (Confirm Pick)</option>
                    <option value="verify-pack">C6: Xác thực Đóng Gói (Verify Pack)</option>
                    <option value="scan-sort">C7: Chia chọn tuyến Courier (Courier Sort)</option>
                    <option value="scan-load">C8: Xếp hàng lên xe (Scan Load)</option>
                    <option value="ship-and-release">C9: Xuất hàng & Giải phóng kệ (Ship & Release)</option>
                    <option value="cycle-count-start">C10: Bắt đầu Kiểm Kê kệ (Cycle Count Start)</option>
                    <option value="confirm-replenish">C11: Xác nhận Di Chuyển Bổ Sung (Confirm Replenish)</option>
                  </select>
                </div>

                {/* Context-specific parameter fields */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  
                  {/* Context ID input */}
                  {["scan-receive", "confirm-putaway", "confirm-crossdock", "confirm-pick", "verify-pack", "scan-load", "ship-and-release", "cycle-count-start", "confirm-replenish"].includes(activeAction) && (
                    <div className="col-span-2">
                      <Label className="text-xs text-foreground/90">
                        {activeAction === "scan-receive" && "ID Phiếu Nhập (Receipt ID)"}
                        {activeAction === "confirm-putaway" && "ID Lệnh Cất Hàng (Putaway Task ID)"}
                        {activeAction === "confirm-crossdock" && "ID Lệnh Crossdock (Crossdock Task ID)"}
                        {activeAction === "confirm-pick" && "ID Lệnh Lấy Hàng (Pick Task ID)"}
                        {activeAction === "verify-pack" && "ID Đơn Xuất Kho (Outbound Order ID)"}
                        {["scan-load", "ship-and-release"].includes(activeAction) && "ID Chuyến xe (Shipment ID - Tùy chọn)"}
                        {activeAction === "cycle-count-start" && "ID Lệnh Kiểm Kho (Count Task ID)"}
                        {activeAction === "confirm-replenish" && "ID Lệnh Bổ Sung (Replenishment Task ID)"}
                      </Label>
                      <Input 
                        className="bg-background border-input h-8 text-xs font-mono mt-1" 
                        value={contextId} 
                        onChange={e => setContextId(e.target.value)}
                        placeholder="Nhập ID thực thi..."
                      />
                    </div>
                  )}

                  {/* Quantity Input */}
                  {["scan-receive", "verify-pack"].includes(activeAction) && (
                    <div>
                      <Label className="text-xs text-foreground/90">Số lượng quét</Label>
                      <Input 
                        type="number" 
                        className="bg-background border-input h-8 text-xs mt-1" 
                        value={qtyInput}
                        onChange={e => setQtyInput(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                  )}

                  {/* Warehouse ID for sorting/transit */}
                  {["transit-receive", "scan-sort"].includes(activeAction) && (
                    <div className="col-span-2">
                      <Label className="text-xs text-foreground/90">
                        {activeAction === "transit-receive" ? "ID Kho hiện tại (Warehouse ID)" : "ID Kho đích (Destination Warehouse ID - Tùy chọn)"}
                      </Label>
                      <Input 
                        className="bg-background border-input h-8 text-xs font-mono mt-1" 
                        value={warehouseIdInput} 
                        onChange={e => setWarehouseIdInput(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Bin Code Input */}
                  {["scan-receive", "confirm-pick"].includes(activeAction) && (
                    <div className="col-span-2">
                      <Label className="text-xs text-foreground/90">Mã Ô Kệ (Bin Code)</Label>
                      <Input 
                        className="bg-background border-input h-8 text-xs font-mono mt-1" 
                        value={binCode} 
                        onChange={e => setBinCode(e.target.value)}
                        placeholder="e.g. BIN-DOCK-01"
                      />
                    </div>
                  )}

                  {/* Lot number & Expiry for receiving */}
                  {activeAction === "scan-receive" && (
                    <>
                      <div>
                        <Label className="text-xs text-foreground/90">Mã Lô (Lot No)</Label>
                        <Input 
                          className="bg-background border-input h-8 text-xs mt-1" 
                          value={lotNo}
                          onChange={e => setLotNo(e.target.value)}
                          placeholder="e.g. LOT-2025"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-foreground/90">Hạn sử dụng</Label>
                        <Input 
                          type="date"
                          className="bg-background border-input h-8 text-xs mt-1" 
                          value={expiryDate}
                          onChange={e => setExpiryDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Bin parameter placeholders for confirm replenish */}
                  {activeAction === "confirm-replenish" && (
                    <div className="col-span-2">
                      <Label className="text-xs text-foreground/90">Bin nguồn đã quét: {lotNo ? <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{lotNo}</span> : <span className="text-muted-foreground/60 italic">Chờ quét Bin nguồn...</span>}</Label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan Log History */}
          <Card className="border-border bg-card/70 backdrop-blur flex-1 min-h-[200px] overflow-hidden flex flex-col">
            <CardHeader className="pb-1 py-3 border-b border-border shrink-0">
              <CardTitle className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Nhật Ký Quét Gần Đây (Lưu session)
              </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {scanHistory.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground/60 py-12 italic">Không có lịch sử quét trong phiên này.</div>
              ) : (
                scanHistory.map(log => (
                  <div key={log.id} className="bg-background border border-border p-2 rounded-lg flex items-start gap-2.5 text-xs">
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-muted-foreground break-all">{log.rawValue}</span>
                        <span className="text-[9px] text-muted-foreground/80 shrink-0 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{log.message}</p>
                    </div>
                    <Badge variant="outline" className={`text-[8px] font-mono shrink-0 px-1 py-0 ${
                      log.status === "success" ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }`}>
                      {log.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Results & Scan Simulator (xl:col-span-7) */}
        <div className="xl:col-span-7 flex flex-col gap-4 overflow-y-auto">
          
          {/* Dynamic Result Panel */}
          <Card className="border-border bg-card/70 backdrop-blur flex-1 min-h-[300px] flex flex-col overflow-hidden">
            <CardHeader className="pb-2 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground">Kết quả xử lý</CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground">Hiển thị thông tin thời gian thực của mã vừa quét</CardDescription>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              
              {/* State 1: Scan verify complete (Verify Pack C6 finished) */}
              {verifyPackComplete && (
                <div className="m-auto max-w-sm text-center py-6 space-y-4">
                  <div className="inline-flex bg-emerald-500/20 p-4 rounded-full border border-emerald-500/50 text-emerald-500 dark:text-emerald-400 animate-bounce">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-500">Verify Pack Hoàn Tất!</h3>
                    <p className="text-xs text-muted-foreground mt-1">Tất cả SKU trong đơn xuất {verifyPackOrderNo} đã được quét đủ số lượng.</p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      onClick={handleCompleteVerifyPack}
                      disabled={isLoading}
                    >
                      Đóng Gói & In Tem Thùng
                    </Button>
                  </div>
                </div>
              )}

              {/* State 2: No scan has occurred */}
              {!scannedResult && !actionResponse && !verifyPackComplete && (
                <div className="m-auto text-center space-y-4 max-w-md py-12">
                  <div className="w-16 h-16 border-2 border-dashed border-border rounded-2xl flex items-center justify-center mx-auto text-muted-foreground/45 animate-pulse">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground">Chờ Quét Nhận Tín Hiệu</h3>
                    <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
                      {activeTab === "lookup" 
                        ? "Vui lòng quét bất kỳ nhãn QR ô kệ, sản phẩm SKU, mã lô vận chuyển hay phiếu nhập kho để tra cứu chi tiết thông tin và tồn kho." 
                        : "Chọn một nghiệp vụ ở cột cấu hình, nhập ID hoạt động và bắt đầu quét mã để xử lý."}
                    </p>
                  </div>
                </div>
              )}

              {/* State 3: Tra cứu thành công (Lookup Result B2-B5) */}
              {activeTab === "lookup" && scannedResult && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#C41E3A] text-white text-xs font-mono">{scannedResult.type}</Badge>
                      <h2 className="text-base font-bold font-mono text-foreground">{scannedResult.entityId || scannedResult.data?.binCode || scannedResult.data?.skuCode}</h2>
                    </div>
                    {/* Print single Qr code */}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-border hover:bg-muted text-foreground/90 h-8"
                      onClick={() => loadPrintQr(scannedResult.type.toLowerCase().replace("_", "-"), scannedResult.entityId || scannedResult.data?.binCode || scannedResult.data?.skuCode, `${scannedResult.type}: ${scannedResult.entityId || scannedResult.data?.binCode || scannedResult.data?.skuCode}`)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      In Tem QR
                    </Button>
                  </div>

                  {/* Rendering details dynamically by type */}
                  {scannedResult.type === "BIN" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Mã Kệ</span><span className="font-mono text-foreground font-bold">{scannedResult.data.binCode}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Phân Khu</span><span className="text-foreground font-semibold">{scannedResult.data.zoneType || "Lưu Trữ"}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Trạng Thái</span><Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">{scannedResult.data.status || "Hoạt động"}</Badge></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Đơn Giữ Hàng</span><span className="font-mono text-foreground/80">{scannedResult.data.currentOrderNo || "-"}</span></div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Hàng hóa đang nằm trong kệ</h4>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50"><TableRow>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold">Mã SKU</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Tồn Thực Tế</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Đang Cấp Phát</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Khả Dụng</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-right">Mã Lô</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                              {!scannedResult.data.items || scannedResult.data.items.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center text-xs py-6 text-muted-foreground/75 italic">Kệ trống, không có hàng.</TableCell></TableRow>
                              ) : (
                                scannedResult.data.items.map((item: any, idx: number) => (
                                  <TableRow key={idx} className="border-border">
                                    <TableCell className="font-mono text-xs font-bold text-foreground">{item.sku}</TableCell>
                                    <TableCell className="text-center text-xs font-bold font-mono">{item.quantityOnHand}</TableCell>
                                    <TableCell className="text-center text-xs text-muted-foreground font-mono">{item.reservedQty}</TableCell>
                                    <TableCell className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{item.availableQty}</TableCell>
                                    <TableCell className="text-right text-xs font-mono text-muted-foreground">{item.lotNo || "-"}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  {scannedResult.type === "SKU" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Mã SKU</span><span className="font-mono text-foreground font-bold">{scannedResult.data.skuCode}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Tổng Tồn Thực Tế</span><span className="text-foreground font-extrabold text-sm font-mono">{scannedResult.data.totalOnHand}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Tổng Cấp Phát</span><span className="text-orange-600 dark:text-orange-400 font-bold text-sm font-mono">{scannedResult.data.totalReserved}</span></div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Phân bố tồn kho tại các ô kệ</h4>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50"><TableRow>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold">Mã Kệ (Bin)</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Tồn tại vị trí</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Đã Giữ hàng</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-right font-mono">Mã Lô</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                              {!scannedResult.data.bins || scannedResult.data.bins.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center text-xs py-6 text-muted-foreground/75 italic">Không có hàng tồn của SKU này trong hệ thống.</TableCell></TableRow>
                              ) : (
                                scannedResult.data.bins.map((bin: any, idx: number) => (
                                  <TableRow key={idx} className="border-border">
                                    <TableCell className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{bin.binCode}</TableCell>
                                    <TableCell className="text-center text-xs font-bold font-mono">{bin.quantityOnHand}</TableCell>
                                    <TableCell className="text-center text-xs text-muted-foreground font-mono">{bin.reservedQty}</TableCell>
                                    <TableCell className="text-right text-xs font-mono text-muted-foreground">{bin.lotNo || "-"}</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  {["ORDER", "OUTBOUND_ORDER"].includes(scannedResult.type) && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Mã đơn xuất</span><span className="font-mono text-foreground font-bold">{scannedResult.data.orderNo}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Kho xuất</span><span className="text-muted-foreground font-mono truncate block">{scannedResult.data.warehouseId}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Thành Phố đích</span><span className="text-foreground font-semibold">{scannedResult.data.destinationCity || "Khác"}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Trạng Thái</span><Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[10px] font-bold">{scannedResult.data.status}</Badge></div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Chi tiết mặt hàng đơn xuất</h4>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50"><TableRow>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold">Mã SKU</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Yêu Cầu</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Đã lấy (Pick)</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-right">Đã đóng gói (Pack)</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                              {scannedResult.data.lines.map((line: any, idx: number) => (
                                <TableRow key={idx} className="border-border">
                                  <TableCell className="font-mono text-xs font-bold text-foreground">{line.sku}</TableCell>
                                  <TableCell className="text-center text-xs font-bold font-mono">{line.requestedQty}</TableCell>
                                  <TableCell className="text-center text-xs text-emerald-600 dark:text-emerald-500 font-mono font-bold">{line.pickedQty}</TableCell>
                                  <TableCell className="text-right text-xs text-purple-600 dark:text-purple-400 font-mono font-bold">{line.packedQty}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Pick locations shortcut link */}
                      {scannedResult.data.binLocations && scannedResult.data.binLocations.length > 0 && (
                        <div className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-lg text-xs space-y-1.5">
                          <span className="font-bold text-[#C41E3A] block">Vị trí kệ lấy hàng (Suggested Bins):</span>
                          <div className="flex gap-2 flex-wrap">
                            {scannedResult.data.binLocations.map((b: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
                                {b.binCode}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {scannedResult.type === "SHIPMENT" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Mã Lô</span><span className="font-mono text-foreground font-bold">{scannedResult.data.shipmentNo}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Nhà vận chuyển</span><span className="text-foreground font-semibold">{scannedResult.data.carrier || "Nội bộ"}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Số đơn trong lô</span><span className="text-foreground font-extrabold text-sm font-mono">{scannedResult.data.orderCount}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Trạng Thái</span><Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">{scannedResult.data.status}</Badge></div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Danh sách các đơn xuất kho trong lô</h4>
                        <div className="border border-border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50"><TableRow>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold">Mã Đơn</TableHead>
                              <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-right">Trạng Thái đơn</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                              {!scannedResult.data.orders || scannedResult.data.orders.length === 0 ? (
                                <TableRow><TableCell colSpan={2} className="text-center text-xs py-6 text-muted-foreground/75 italic">Lô hàng rỗng, chưa có đơn.</TableCell></TableRow>
                              ) : (
                                scannedResult.data.orders.map((o: any, idx: number) => (
                                  <TableRow key={idx} className="border-border">
                                    <TableCell className="font-mono text-xs font-bold text-foreground">{o.orderNo}</TableCell>
                                    <TableCell className="text-right text-xs"><Badge variant="outline" className="bg-muted text-muted-foreground">{o.status}</Badge></TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  {scannedResult.type === "RECEIPT" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Mã Phiếu Nhập</span><span className="font-mono text-foreground font-bold">{scannedResult.data.receiptNo}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Tổng Số Dòng</span><span className="text-foreground font-bold font-mono">{scannedResult.data.lineCount}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Trạng Thái</span><Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] font-bold">{scannedResult.data.status}</Badge></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* State 4: Nghiệp vụ thành công (Action API Response C1-C11) */}
              {activeTab === "actions" && actionResponse && !verifyPackComplete && (
                <div className="space-y-6">
                  
                  {/* Action status summary header */}
                  <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Giao dịch thành công!</h3>
                      <p className="text-[11px] text-muted-foreground">Lệnh quét đã được hệ thống lưu vết và thực thi hoàn tất.</p>
                    </div>
                  </div>

                  {/* Rendering contextual details by action */}
                  {actionResponse.action === "scan-receive" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-foreground/90">Kết quả nhận hàng:</h4>
                      <div className="bg-muted/50 p-4 rounded-xl space-y-4 text-xs">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                          <span className="text-muted-foreground">Mã SKU:</span>
                          <span className="font-mono text-foreground font-bold">{actionResponse.data.lineProgress?.sku}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tiến độ dòng:</span>
                            <span className="font-mono text-foreground/80 font-bold">{actionResponse.data.lineProgress?.received} / {actionResponse.data.lineProgress?.expected} sản phẩm</span>
                          </div>
                          <Progress 
                            value={(actionResponse.data.lineProgress?.received / actionResponse.data.lineProgress?.expected) * 100}
                            className="h-2 bg-muted [&>div]:bg-emerald-500"
                          />
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>Trạng thái Phiếu Nhập:</span>
                          <span>{actionResponse.data.receiptStatus}</span>
                        </div>
                      </div>

                      {/* Target Putaway suggestion alert box */}
                      {actionResponse.data.suggestion && (
                        <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl text-xs space-y-2">
                          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                            <Info className="h-4 w-4" />
                            Gợi ý chỉ định kệ (Suggested action):
                          </div>
                          <p className="text-muted-foreground leading-tight">
                            Hàng đã nhận ở Staging. Vui lòng tạo/thực hiện Task cất hàng 
                            {actionResponse.data.suggestion.type === "PUTAWAY" ? " (Putaway) " : " (Crossdock) "} 
                            đến kệ gợi ý: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-muted px-1.5 py-0.5 rounded border border-border">{actionResponse.data.suggestion.suggestedBinCode}</span>.
                          </p>
                          <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Task ID liên quan:</span>
                            <span className="font-mono text-muted-foreground font-semibold">{actionResponse.data.suggestion.taskId}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verify Pack Progress table state (C6 Pack verification) */}
                  {actionResponse.action === "verify-pack" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-foreground/90 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          Tiến độ đóng gói đơn hàng
                        </h4>
                        <span className="text-[10px] text-muted-foreground">Đơn: <span className="font-mono text-foreground font-semibold">{verifyPackOrderNo}</span></span>
                      </div>
                      
                      <div className="border border-border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50"><TableRow>
                            <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold">Mã SKU</TableHead>
                            <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Yêu Cầu</TableHead>
                            <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-center">Đã Quét</TableHead>
                            <TableHead className="text-[9px] uppercase h-8 text-muted-foreground font-bold text-right">Trạng Thái</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {verifyPackItems.map((item: any, idx: number) => (
                              <TableRow key={idx} className={`border-border ${item.complete ? "bg-emerald-500/5" : ""}`}>
                                <TableCell className="font-mono text-xs font-bold text-foreground">{item.sku}</TableCell>
                                <TableCell className="text-center text-xs font-bold font-mono">{item.required}</TableCell>
                                <TableCell className={`text-center text-xs font-bold font-mono ${item.complete ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-550"}`}>{item.scanned}</TableCell>
                                <TableCell className="text-right text-xs">
                                  {item.complete ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] py-0.5">Xong</Badge>
                                  ) : (
                                    <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] py-0.5 animate-pulse">Chờ Quét...</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Courier Sort C7 Router Display */}
                  {actionResponse.action === "scan-sort" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-foreground/90">Thông tin Tuyến phân chọn (Sorting & Routing):</h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Mã vận đơn</span><span className="font-mono text-foreground font-bold">{actionResponse.data.waybillCode}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Gom vào Shipment</span><span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{actionResponse.data.shipment?.shipmentNo}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Kho Điểm Đến Cuối</span><span className="text-foreground font-semibold">{actionResponse.data.routing?.finalDestination}</span></div>
                        <div className="bg-muted/50 p-3 rounded-lg"><span className="text-muted-foreground block uppercase font-bold text-[9px] mb-1">Tuyến Trung Chuyển (Tiếp)</span><span className="text-blue-600 dark:text-blue-400 font-semibold">{actionResponse.data.routing?.nextHop}</span></div>
                      </div>
                    </div>
                  )}

                  {/* Load scan / ship and release feedback */}
                  {["scan-load", "ship-and-release", "confirm-putaway", "confirm-crossdock", "confirm-pick", "cycle-count-start", "confirm-replenish"].includes(actionResponse.action) && (
                    <div className="bg-muted/50 p-4 rounded-xl text-xs space-y-2 font-mono">
                      {Object.keys(actionResponse.data).map((key) => {
                        if (key === "success" || key === "successResponse") return null;
                        const val = actionResponse.data[key];
                        const displayVal = typeof val === "object" ? JSON.stringify(val) : String(val);
                        return (
                          <div key={key} className="flex justify-between border-b border-border/50 py-1">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="text-foreground font-bold">{displayVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>



      {/* Printable QR Code Dialog */}
      {printQrUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4">
          <Card className="max-w-xs w-full bg-card border-border shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C41E3A]" />
            <CardHeader className="pb-2 flex flex-row justify-between items-start gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Tem Nhãn QR Code</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground font-mono mt-0.5">{printQrTitle}</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setPrintQrUrl(null)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="bg-white p-3 rounded-lg flex items-center justify-center border border-slate-800">
                <img src={printQrUrl} className="w-48 h-48 block" alt="Printable QR Code" />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800"
                  onClick={() => setPrintQrUrl(null)}
                >
                  Đóng
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-[#C41E3A] hover:bg-[#a01830] text-white font-bold"
                  onClick={handlePrint}
                >
                  In Ngay (Print)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
