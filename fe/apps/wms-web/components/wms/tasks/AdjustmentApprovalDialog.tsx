"use client"

import { useState, useEffect } from "react"
import { CycleCountTaskDto } from "@/types/wms-tasks"
import { approveCycleCount, rejectCycleCount } from "@/lib/api/wms-tasks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@repo/ui/components/dialog"
import { Button } from "@repo/ui/components/button"
import { Textarea } from "@repo/ui/components/textarea"
import { Label } from "@repo/ui/components/label"
import {
  ClipboardCheck,
  Scale,
  User,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert
} from "lucide-react"
import { toast } from "sonner"

interface AdjustmentApprovalDialogProps {
  isOpen: boolean
  onClose: () => void
  task: CycleCountTaskDto | null
  onSuccess: () => void
}

export function AdjustmentApprovalDialog({
  isOpen,
  onClose,
  task,
  onSuccess
}: AdjustmentApprovalDialogProps) {
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Reset notes when task changes
  useEffect(() => {
    setNotes("")
  }, [task])

  if (!task) return null

  const isReadOnly = task.status === "Approved" || task.status === "Rejected"

  const expected = task.expectedQty
  const counted = task.countedQty ?? 0
  const diff = counted - expected

  const handleApprove = async () => {
    try {
      setSubmitting(true)
      await approveCycleCount(task.id, notes)
      toast.success(`Đã phê duyệt điều chỉnh tồn kho cho tác vụ ${task.id}. Hệ thống sẽ cập nhật số dư thực tế là ${counted}.`)
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Phê duyệt thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    try {
      setSubmitting(true)
      await rejectCycleCount(task.id, notes)
      toast.warning(`Đã bác bỏ kết quả kiểm kê cho tác vụ ${task.id}. Yêu cầu nhân viên thực hiện đếm lại.`)
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Bác bỏ thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] bg-card border border-muted shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-extrabold text-lg">
            {isReadOnly ? (
              task.status === "Approved" ? (
                <ShieldCheck className="h-5 w-5 text-emerald-500 animate-pulse" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-rose-500 animate-pulse" />
              )
            ) : (
              <Scale className="h-5 w-5 text-indigo-500" />
            )}
            {isReadOnly ? "Lịch Sử Phán Quyết Kiểm Kho" : "Xét Duyệt Kết Quả Kiểm Kho"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs mt-1">
            {isReadOnly
              ? "Xem chi tiết biên bản phán quyết, lịch sử điều chỉnh số liệu và ghi chú của giám sát kho."
              : "Đánh giá kết quả kiểm đếm thực tế của nhân viên và đưa ra phán quyết điều chỉnh số liệu hệ thống cho tác vụ."}{" "}
            Mã tác vụ: <span className="font-mono font-bold text-primary">{task.id}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Read-Only Status Banner */}
        {isReadOnly && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold ${
              task.status === "Approved"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
            }`}
          >
            {task.status === "Approved" ? (
              <>
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                <span>ĐÃ DUYỆT ĐIỀU CHỈNH: Đồng ý cập nhật số liệu vật lý {counted} vào tồn kho.</span>
              </>
            ) : (
              <>
                <XCircle className="h-4.5 w-4.5 shrink-0" />
                <span>ĐÃ BÁC BỎ: Từ chối số liệu đếm, yêu cầu bưu tá thực hiện đếm lại.</span>
              </>
            )}
          </div>
        )}

        {/* Detailed Metrics Panel */}
        <div className="space-y-3.5 my-2">
          {/* Discrepancy Card */}
          <div className={`p-4 rounded-xl space-y-3 border ${
            diff === 0 
              ? "bg-emerald-500/5 border-emerald-500/10" 
              : "bg-rose-500/5 border-rose-500/10"
          }`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Tồn Kho Hệ Thống (Expected)
                </span>
                <span className="text-xl font-black font-mono text-slate-500">
                  {expected}
                </span>
              </div>
              <div className="space-y-1 border-l border-muted/60 pl-4">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Thực Tế Kiểm Đếm (Counted)
                </span>
                <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {counted}
                </span>
              </div>
            </div>

            <div className={`border-t pt-2.5 flex items-center justify-between ${
              diff === 0 ? "border-emerald-500/10" : "border-rose-500/10"
            }`}>
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                diff === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}>
                {diff === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                )}
                Chênh lệch số liệu:
              </span>
              <span className={`text-sm font-black font-mono ${
                diff === 0 
                  ? "text-emerald-500" 
                  : diff > 0 
                  ? "text-amber-500" 
                  : "text-rose-500"
              }`}>
                {diff === 0 ? "Khớp tồn kho" : diff > 0 ? `+${diff}` : diff}
              </span>
            </div>
          </div>

          {/* Item & Bin Metadata */}
          <div className="bg-muted/40 border border-muted p-3.5 rounded-xl text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã SKU:</span>
              <span className="font-bold font-mono text-foreground">{task.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vị trí Ô kệ (Bin):</span>
              <span className="font-bold font-mono text-[#C41E3A]">{task.binCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Nhân viên đếm:</span>
              <span className="font-bold text-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {task.operatorName || "Chưa phân bổ"}
              </span>
            </div>
            {task.notes && (
              <div className="border-t border-muted pt-2 mt-2 space-y-1">
                <span className="text-muted-foreground font-bold">Ghi chú thực địa của nhân viên:</span>
                <p className="italic text-muted-foreground leading-relaxed bg-background/50 p-2 rounded border border-muted/50 text-[11px]">
                  {task.notes}
                </p>
              </div>
            )}
          </div>

          {/* Decision Notes Display (Read-only vs Input) */}
          {isReadOnly ? (
            <div className="space-y-1.5 bg-muted/50 p-3 rounded-xl border border-muted/80">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Ý Kiến Phán Quyết Của Quản Đốc:
              </span>
              <p className="text-xs text-foreground italic font-semibold leading-relaxed bg-background p-2.5 rounded border border-muted/60">
                {task.supervisorNotes || "Không có ghi chú phán quyết chi tiết."}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="supervisor-notes" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Ghi Chú Phán Quyết / Lý Do Điều Chỉnh <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="supervisor-notes"
                placeholder="VD: Xác nhận rách bao bì, duyệt giảm tồn kho..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background border-muted rounded-xl text-xs h-20 focus-visible:ring-[#C41E3A]"
              />
            </div>
          )}
        </div>

        {/* Dialog Actions Footer */}
        <DialogFooter className="gap-2 pt-2 border-t border-muted/60 mt-4 flex flex-col sm:flex-row">
          {isReadOnly ? (
            <Button
              type="button"
              onClick={onClose}
              className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold rounded-xl text-xs h-9 w-full sm:w-28 ml-auto shadow-md"
            >
              Đóng lại
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl text-xs h-9 order-3 sm:order-1 w-full sm:w-auto"
              >
                Hủy
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                disabled={submitting || !notes.trim()}
                onClick={handleReject}
                className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-bold rounded-xl text-xs h-9 flex items-center gap-1.5 order-2 w-full sm:w-auto border border-rose-500/20"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Bác Bỏ (Reject)
              </Button>

              <Button
                type="button"
                disabled={submitting || !notes.trim()}
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 flex items-center gap-1.5 order-1 w-full sm:w-auto shadow-md"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Duyệt Điều Chỉnh
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
