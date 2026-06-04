"use client"

import { useState, useEffect } from "react"
import { GitMerge, Scan, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { toast } from "sonner"
import * as crossdockService from "@/lib/services/crossdock"
import type { CrossDockTask } from "@/lib/types"

export default function CrossDockPage() {
  const [tasks, setTasks] = useState<CrossDockTask[]>([])
  const [completeForm, setCompleteForm] = useState({ taskId: "", destBinCode: "" })

  const loadTasks = async () => {
    try { setTasks(await crossdockService.getCrossDockTasks("Pending") || []) }
    catch (e) { toast.error("Failed to load cross-dock tasks") }
  }

  useEffect(() => { loadTasks() }, [])

  const handleComplete = async () => {
    if (!completeForm.taskId || !completeForm.destBinCode) return;
    try {
      await crossdockService.completeCrossDockTask(completeForm.taskId, completeForm.destBinCode);
      toast.success(`Cross-dock task ${completeForm.taskId} completed`);
      loadTasks();
      setCompleteForm({ taskId: "", destBinCode: "" })
    } catch (e) { toast.error("Failed to complete task") }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[#A01830] text-white border-b border-border px-4 py-2 flex items-center justify-between">
        <h1 className="text-sm font-semibold flex items-center gap-2"><GitMerge className="h-4 w-4" /> Cross-Docking (Priority)</h1>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-red-500/20 text-white border border-red-500/50 rounded flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Do Not Store</span>
      </div>
      <div className="flex-1 overflow-auto p-4 flex flex-col md:flex-row gap-4">
        
        <div className="flex-1 border border-border bg-white h-fit rounded">
          <div className="bg-muted px-3 py-1.5 border-b border-border flex justify-between items-center rounded-t">
            <h3 className="text-xs font-semibold uppercase text-red-600">Pending Luân Chuyển Thẳng</h3>
            <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={loadTasks}>Refresh</Button>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-[10px] uppercase h-8">Task ID</TableHead>
              <TableHead className="text-[10px] uppercase h-8">Source (Receipt)</TableHead>
              <TableHead className="text-[10px] uppercase h-8">Dest (Order)</TableHead>
              <TableHead className="text-[10px] uppercase h-8">SKU</TableHead>
              <TableHead className="text-[10px] uppercase h-8 text-center">Qty</TableHead>
              <TableHead className="text-[10px] uppercase h-8 text-center">Move From</TableHead>
              <TableHead className="text-[10px] uppercase h-8 text-center">Move To</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {!tasks || tasks.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-xs py-4 text-muted-foreground">No active cross-dock tasks</TableCell></TableRow> : 
                tasks.map(t => (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-red-50/50" onClick={() => setCompleteForm({...completeForm, taskId: t.id})}>
                    <TableCell className="text-xs font-mono">{t.id}</TableCell>
                    <TableCell className="text-xs font-mono text-blue-600">{t.inboundReceiptId}</TableCell>
                    <TableCell className="text-xs font-mono text-blue-600">{t.outboundOrderId}</TableCell>
                    <TableCell className="text-xs font-mono">{t.sku}</TableCell>
                    <TableCell className="text-xs text-center font-bold text-red-600">{t.quantity}</TableCell>
                    <TableCell className="text-xs text-center font-mono text-muted-foreground">{t.inboundStagingBinCode}</TableCell>
                    <TableCell className="text-xs text-center font-mono font-bold bg-yellow-100 rounded px-1">{t.outboundStagingBinCode}</TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>

        <div className="w-full md:w-80 border border-red-200 bg-red-50/20 h-fit rounded">
          <div className="bg-red-50 text-red-800 border-b border-red-200 px-3 py-1.5 flex items-center gap-2 rounded-t"><Scan className="h-4 w-4" /><h3 className="text-xs font-bold uppercase">Scanner Action</h3></div>
          <div className="p-4 space-y-4">
            <div><Label className="text-xs font-bold text-red-700">Scan Task / Item SKU</Label><Input className="h-10 text-sm mt-1 font-mono border-red-300 focus-visible:ring-red-500" value={completeForm.taskId} onChange={e=>setCompleteForm({...completeForm,taskId:e.target.value})} placeholder="e.g. CD-TASK-001" /></div>
            <div><Label className="text-xs font-bold text-red-700">Scan Outbound Staging Bin</Label><Input className="h-10 text-sm mt-1 font-mono border-red-300 focus-visible:ring-red-500" value={completeForm.destBinCode} onChange={e=>setCompleteForm({...completeForm,destBinCode:e.target.value})} placeholder="e.g. OUT-STG-A" /></div>
            <Button className="w-full h-10 text-sm bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20" onClick={handleComplete} disabled={!completeForm.taskId || !completeForm.destBinCode}><CheckCircle className="h-4 w-4 mr-2" />Confirm Drop-off</Button>
            <div className="text-[10px] text-red-600/80 bg-red-100 p-2 rounded border border-red-200 leading-tight">
              * Vui lòng di chuyển hàng trực tiếp đến khu vực Xuất kho. Không cất lên kệ lưu trữ (Storage Bin).
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
