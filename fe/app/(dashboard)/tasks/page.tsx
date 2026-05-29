"use client"

import { useState, useEffect } from "react"
import { ClipboardList, ArchiveRestore, RefreshCcw, ClipboardCheck, ArrowRight, CheckCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import * as tasksService from "@/lib/services/tasks"
import type { PutawayTask, ReplenishmentTask, CycleCountTask } from "@/lib/types"

export default function InternalTasksPage() {
  const [activeTab, setActiveTab] = useState("putaway")
  
  // Putaway State
  const [putawayTasks, setPutawayTasks] = useState<PutawayTask[]>([])
  const [completePutawayForm, setCompletePutawayForm] = useState({ taskId: "", destBinCode: "" })

  // Replenish State
  const [replenishTasks, setReplenishTasks] = useState<ReplenishmentTask[]>([])
  const [genReplenishForm, setGenReplenishForm] = useState({ tenantId: "T-001", warehouseId: "W-001" })

  // Cycle Count State
  const [cycleTasks, setCycleTasks] = useState<CycleCountTask[]>([
    { id: "CC-001", binId: "BIN-A1-01", sku: "SKU-TEST-1", expectedQty: 100, status: "Pending" } // Dummy data since no GET api yet
  ])
  const [genCycleForm, setGenCycleForm] = useState({ tenantId: "T-001", warehouseId: "W-001", maxTasks: 5 })
  const [submitCycleForm, setSubmitCycleForm] = useState({ taskId: "", countedQty: 0 })

  const loadPutaway = async () => {
    try { setPutawayTasks(await tasksService.getPutawayTasks("Pending") || []) }
    catch (e) { toast.error("Failed to load Putaway tasks") }
  }

  const loadReplenish = async () => {
    try { setReplenishTasks(await tasksService.getReplenishmentTasks("Pending") || []) }
    catch (e) { toast.error("Failed to load Replenishment tasks") }
  }

  useEffect(() => {
    if (activeTab === "putaway") loadPutaway()
    if (activeTab === "replenish") loadReplenish()
  }, [activeTab])

  // Handlers
  const handleCompletePutaway = async () => {
    if (!completePutawayForm.taskId || !completePutawayForm.destBinCode) return;
    try {
      await tasksService.completePutawayTask(completePutawayForm.taskId, completePutawayForm.destBinCode);
      toast.success(`Putaway task ${completePutawayForm.taskId} completed`);
      loadPutaway();
      setCompletePutawayForm({ taskId: "", destBinCode: "" })
    } catch (e) { toast.error("Failed to complete Putaway") }
  }

  const handleGenReplenish = async () => {
    try {
      await tasksService.generateReplenishmentTasks(genReplenishForm.tenantId, genReplenishForm.warehouseId);
      toast.success("Replenishment tasks generated");
      loadReplenish();
    } catch (e) { toast.error("Failed to generate replenishment") }
  }
  
  const handleCompleteReplenish = async (taskId: string) => {
    try {
      await tasksService.completeReplenishmentTask(taskId);
      toast.success(`Replenishment task ${taskId} completed`);
      loadReplenish();
    } catch (e) { toast.error("Failed to complete Replenishment") }
  }

  const handleGenCycleCount = async () => {
    try {
      await tasksService.generateCycleCountTasks(genCycleForm.tenantId, genCycleForm.warehouseId, genCycleForm.maxTasks);
      toast.success("Cycle count tasks generated");
    } catch (e) { toast.error("Failed to generate cycle counts") }
  }

  const handleSubmitCycle = async () => {
    if (!submitCycleForm.taskId) return;
    try {
      await tasksService.submitCycleCount(submitCycleForm.taskId, submitCycleForm.countedQty);
      toast.success(`Cycle count ${submitCycleForm.taskId} submitted`);
      setSubmitCycleForm({ taskId: "", countedQty: 0 })
    } catch (e) { toast.error("Failed to submit count") }
  }

  const handleApproveCycle = async (taskId: string) => {
    try {
      await tasksService.approveCycleCount(taskId);
      toast.success(`Cycle count ${taskId} approved`);
    } catch (e) { toast.error("Failed to approve count") }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted border-b border-border px-4 py-2">
        <h1 className="text-sm font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Internal Tasks Management</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="h-8">
            <TabsTrigger value="putaway" className="text-xs h-7"><ArchiveRestore className="h-3 w-3 mr-1" /> Putaway</TabsTrigger>
            <TabsTrigger value="replenish" className="text-xs h-7"><RefreshCcw className="h-3 w-3 mr-1" /> Replenishment</TabsTrigger>
            <TabsTrigger value="cycle" className="text-xs h-7"><ClipboardCheck className="h-3 w-3 mr-1" /> Cycle Count</TabsTrigger>
          </TabsList>

          <TabsContent value="putaway" className="space-y-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 border border-border bg-white rounded">
              <div className="bg-muted px-3 py-1.5 border-b border-border rounded-t"><h3 className="text-xs font-semibold uppercase">Pending Putaway Tasks</h3></div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-[10px] uppercase h-8">Task ID</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">SKU</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-center">Qty</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-center">From Bin</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-center">Suggested Bin</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {!putawayTasks || putawayTasks.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-xs py-4 text-muted-foreground">No pending putaway tasks found.</TableCell></TableRow> : 
                    putawayTasks.map(t => (
                      <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setCompletePutawayForm({...completePutawayForm, taskId: t.id})}>
                        <TableCell className="text-xs font-mono">{t.id}</TableCell>
                        <TableCell className="text-xs font-mono">{t.sku}</TableCell>
                        <TableCell className="text-xs text-center">{t.quantity}</TableCell>
                        <TableCell className="text-xs text-center font-mono text-muted-foreground">{t.sourceBinId}</TableCell>
                        <TableCell className="text-xs text-center font-mono font-bold text-blue-600">{t.suggestedBinId}</TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
            <div className="w-full md:w-80 border border-border bg-white h-fit rounded">
              <div className="bg-muted px-3 py-1.5 border-b border-border rounded-t"><h3 className="text-xs font-semibold uppercase">Scanner - Complete Putaway</h3></div>
              <div className="p-4 space-y-3">
                <div><Label className="text-xs">Task ID</Label><Input className="h-8 text-xs mt-1 font-mono" value={completePutawayForm.taskId} onChange={e=>setCompletePutawayForm({...completePutawayForm,taskId:e.target.value})} /></div>
                <div><Label className="text-xs">Actual Destination Bin (Scan)</Label><Input className="h-8 text-xs mt-1 font-mono border-blue-500 focus-visible:ring-blue-500" value={completePutawayForm.destBinCode} onChange={e=>setCompletePutawayForm({...completePutawayForm,destBinCode:e.target.value})} /></div>
                <Button className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={handleCompletePutaway} disabled={!completePutawayForm.taskId || !completePutawayForm.destBinCode}><CheckCircle className="h-3 w-3 mr-1" />Confirm Putaway</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="replenish" className="space-y-4 flex flex-col xl:flex-row gap-4">
             <div className="w-full xl:w-72 border border-border bg-white h-fit rounded">
              <div className="bg-muted px-3 py-1.5 border-b border-border rounded-t"><h3 className="text-xs font-semibold uppercase">Generate Tasks</h3></div>
              <div className="p-4 space-y-3">
                <div><Label className="text-xs">Tenant ID</Label><Input className="h-8 text-xs mt-1" value={genReplenishForm.tenantId} onChange={e=>setGenReplenishForm({...genReplenishForm,tenantId:e.target.value})} /></div>
                <div><Label className="text-xs">Warehouse ID</Label><Input className="h-8 text-xs mt-1" value={genReplenishForm.warehouseId} onChange={e=>setGenReplenishForm({...genReplenishForm,warehouseId:e.target.value})} /></div>
                <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleGenReplenish}><Plus className="h-3 w-3 mr-1" />Run Algorithm</Button>
              </div>
            </div>
            <div className="flex-1 border border-border bg-white rounded">
              <div className="bg-muted px-3 py-1.5 border-b border-border rounded-t"><h3 className="text-xs font-semibold uppercase">Pending Replenishment</h3></div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-[10px] uppercase h-8">Task ID</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">SKU</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-center">Qty</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-center">Movement</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {!replenishTasks || replenishTasks.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-xs py-4 text-muted-foreground">No tasks found</TableCell></TableRow> : 
                    replenishTasks.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-mono">{t.id}</TableCell>
                        <TableCell className="text-xs font-mono">{t.sku}</TableCell>
                        <TableCell className="text-xs text-center font-bold">{t.quantity}</TableCell>
                        <TableCell className="text-xs text-center"><div className="flex items-center justify-center gap-2"><span className="font-mono bg-gray-100 px-1 rounded">{t.fromBinId}</span><ArrowRight className="h-3 w-3 text-muted-foreground"/><span className="font-mono bg-blue-50 text-blue-700 px-1 rounded">{t.toBinId}</span></div></TableCell>
                        <TableCell className="text-right"><Button size="sm" variant="outline" className="h-7 text-xs" onClick={()=>handleCompleteReplenish(t.id)}>Complete</Button></TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="cycle" className="space-y-4 flex flex-col lg:flex-row gap-4">
             <div className="w-full lg:w-72 space-y-4">
               <div className="border border-border bg-white h-fit rounded">
                <div className="bg-muted px-3 py-1.5 border-b border-border rounded-t"><h3 className="text-xs font-semibold uppercase">Generate Cycle Count</h3></div>
                <div className="p-4 space-y-3">
                  <div><Label className="text-xs">Warehouse ID</Label><Input className="h-8 text-xs mt-1" value={genCycleForm.warehouseId} onChange={e=>setGenCycleForm({...genCycleForm,warehouseId:e.target.value})} /></div>
                  <div><Label className="text-xs">Max Tasks</Label><Input type="number" className="h-8 text-xs mt-1" value={genCycleForm.maxTasks} onChange={e=>setGenCycleForm({...genCycleForm,maxTasks:Number(e.target.value)})} /></div>
                  <Button className="w-full h-8 text-xs" variant="outline" onClick={handleGenCycleCount}><Plus className="h-3 w-3 mr-1" />Generate Tasks</Button>
                </div>
              </div>
              <div className="border border-border bg-white h-fit rounded">
                <div className="bg-muted px-3 py-1.5 border-b border-border rounded-t"><h3 className="text-xs font-semibold uppercase">Blind Count Submission (Scanner)</h3></div>
                <div className="p-4 space-y-3">
                  <div><Label className="text-xs">Task ID</Label><Input className="h-8 text-xs mt-1 font-mono" value={submitCycleForm.taskId} onChange={e=>setSubmitCycleForm({...submitCycleForm,taskId:e.target.value})} /></div>
                  <div><Label className="text-xs">Counted Qty</Label><Input type="number" className="h-8 text-xs mt-1" value={submitCycleForm.countedQty} onChange={e=>setSubmitCycleForm({...submitCycleForm,countedQty:Number(e.target.value)})} /></div>
                  <Button className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmitCycle}><CheckCircle className="h-3 w-3 mr-1" />Submit Count</Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 border border-border bg-white rounded">
              <div className="bg-muted px-3 py-1.5 border-b border-border rounded-t"><h3 className="text-xs font-semibold uppercase">Cycle Count Tasks (Admin View)</h3></div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-[10px] uppercase h-8">Task ID</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">Bin</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">SKU</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-center">Expected</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-center">Counted</TableHead>
                  <TableHead className="text-[10px] uppercase h-8">Status</TableHead>
                  <TableHead className="text-[10px] uppercase h-8 text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cycleTasks.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-xs py-4 text-muted-foreground">No tasks found</TableCell></TableRow> : 
                    cycleTasks.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-mono">{t.id}</TableCell>
                        <TableCell className="text-xs font-mono">{t.binId}</TableCell>
                        <TableCell className="text-xs font-mono">{t.sku}</TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground">{t.expectedQty}</TableCell>
                        <TableCell className="text-xs text-center font-bold text-blue-600">{t.countedQty ?? "-"}</TableCell>
                        <TableCell className="text-xs"><span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">{t.status}</span></TableCell>
                        <TableCell className="text-right"><Button size="sm" variant="outline" className="h-7 text-xs border-green-200 hover:bg-green-50 hover:text-green-700" onClick={()=>handleApproveCycle(t.id)}>Approve</Button></TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
