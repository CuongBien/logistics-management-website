"use client"

import { useState, useEffect } from "react"
import { ClipboardList, ArchiveRestore, RefreshCcw, ClipboardCheck, ArrowRight, CheckCircle, Plus, UserCheck, Inbox } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { toast } from "sonner"
import * as tasksService from "@/lib/services/tasks"
import type { PutawayTask, ReplenishmentTask, CycleCountTask } from "@/lib/types"

export default function InternalTasksPage() {
  const [activeTab, setActiveTab] = useState("putaway")
  
  // Putaway State
  const [putawayTasks, setPutawayTasks] = useState<PutawayTask[]>([])
  const [unassignedPutawayTasks, setUnassignedPutawayTasks] = useState<PutawayTask[]>([])
  const [completePutawayForm, setCompletePutawayForm] = useState({ taskId: "", destBinCode: "" })

  // Replenish State
  const [replenishTasks, setReplenishTasks] = useState<ReplenishmentTask[]>([])
  const [unassignedReplenishTasks, setUnassignedReplenishTasks] = useState<ReplenishmentTask[]>([])
  const [genReplenishForm, setGenReplenishForm] = useState({ tenantId: "default-tenant", warehouseId: "WH-HP-007" })

  // Cycle Count State
  const [cycleTasks, setCycleTasks] = useState<CycleCountTask[]>([])
  const [unassignedCycleTasks, setUnassignedCycleTasks] = useState<CycleCountTask[]>([])
  const [genCycleForm, setGenCycleForm] = useState({ tenantId: "default-tenant", warehouseId: "WH-HP-007", maxTasks: 5 })
  const [submitCycleForm, setSubmitCycleForm] = useState({ taskId: "", countedQty: 0 })

  const loadPutaway = async () => {
    try {
      const myTasks = await tasksService.getPutawayTasks("Pending", { assignedToMe: true })
      const unassigned = await tasksService.getPutawayTasks("Pending", { unassigned: true })
      setPutawayTasks(myTasks || [])
      setUnassignedPutawayTasks(unassigned || [])
    }
    catch (e) { toast.error("Failed to load Putaway tasks") }
  }

  const loadReplenish = async () => {
    try {
      const myTasks = await tasksService.getReplenishmentTasks("Pending", { assignedToMe: true })
      const unassigned = await tasksService.getReplenishmentTasks("Pending", { unassigned: true })
      setReplenishTasks(myTasks || [])
      setUnassignedReplenishTasks(unassigned || [])
    }
    catch (e) { toast.error("Failed to load Replenishment tasks") }
  }

  const loadCycleCount = async () => {
    try {
      const myTasks = await tasksService.getCycleCountTasks("Pending", { assignedToMe: true })
      const unassigned = await tasksService.getCycleCountTasks("Pending", { unassigned: true })
      setCycleTasks(myTasks || [])
      setUnassignedCycleTasks(unassigned || [])
    }
    catch (e) { toast.error("Failed to load Cycle Count tasks") }
  }

  useEffect(() => {
    if (activeTab === "putaway") loadPutaway()
    if (activeTab === "replenish") loadReplenish()
    if (activeTab === "cycle") loadCycleCount()
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

  const handleClaimPutaway = async (id: string) => {
    try {
      await tasksService.claimPutawayTask(id)
      toast.success("Đã nhận việc Putaway thành công!")
      loadPutaway()
    } catch (e) { toast.error("Không thể nhận việc Putaway") }
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

  const handleClaimReplenish = async (id: string) => {
    try {
      await tasksService.claimReplenishmentTask(id)
      toast.success("Đã nhận việc Replenishment thành công!")
      loadReplenish()
    } catch (e) { toast.error("Không thể nhận việc Replenishment") }
  }

  const handleGenCycleCount = async () => {
    try {
      await tasksService.generateCycleCountTasks(genCycleForm.tenantId, genCycleForm.warehouseId, genCycleForm.maxTasks);
      toast.success("Cycle count tasks generated");
      loadCycleCount();
    } catch (e) { toast.error("Failed to generate cycle counts") }
  }

  const handleSubmitCycle = async () => {
    if (!submitCycleForm.taskId) return;
    try {
      await tasksService.submitCycleCount(submitCycleForm.taskId, submitCycleForm.countedQty);
      toast.success(`Cycle count ${submitCycleForm.taskId} submitted`);
      setSubmitCycleForm({ taskId: "", countedQty: 0 })
      loadCycleCount();
    } catch (e) { toast.error("Failed to submit count") }
  }

  const handleClaimCycleCount = async (id: string) => {
    try {
      await tasksService.claimCycleCountTask(id)
      toast.success("Đã nhận việc Cycle Count thành công!")
      loadCycleCount()
    } catch (e) { toast.error("Không thể nhận việc Cycle Count") }
  }

  const handleApproveCycle = async (taskId: string) => {
    try {
      await tasksService.approveCycleCount(taskId);
      toast.success(`Cycle count ${taskId} approved`);
      loadCycleCount();
    } catch (e) { toast.error("Failed to approve count") }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <ClipboardList className="h-5 w-5 text-[#C41E3A]" /> 
          Quản Lý Công Việc Nội Bộ
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => {
            if (activeTab === "putaway") loadPutaway()
            if (activeTab === "replenish") loadReplenish()
            if (activeTab === "cycle") loadCycleCount()
          }}>
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-10 bg-white border border-slate-200 p-1 rounded-lg">
            <TabsTrigger value="putaway" className="text-xs h-8 rounded-md data-[state=active]:bg-slate-100"><ArchiveRestore className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Putaway (Cất hàng)</TabsTrigger>
            <TabsTrigger value="replenish" className="text-xs h-8 rounded-md data-[state=active]:bg-slate-100"><RefreshCcw className="h-3.5 w-3.5 mr-1.5 text-purple-600" /> Replenishment (Bồi hàng)</TabsTrigger>
            <TabsTrigger value="cycle" className="text-xs h-8 rounded-md data-[state=active]:bg-slate-100"><ClipboardCheck className="h-3.5 w-3.5 mr-1.5 text-amber-600" /> Cycle Count (Kiểm kho)</TabsTrigger>
          </TabsList>

          {/* PUTAWAY TAB */}
          <TabsContent value="putaway" className="space-y-4 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Tabs defaultValue="my-tasks" className="w-full">
                <TabsList className="h-8 bg-transparent p-0 gap-2 border-b border-slate-200 rounded-none w-full justify-start">
                  <TabsTrigger value="my-tasks" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-3 py-1 font-semibold flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-blue-600" /> Nhiệm vụ của tôi ({putawayTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="unassigned" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-600 data-[state=active]:bg-transparent px-3 py-1 font-semibold flex items-center gap-1.5">
                    <Inbox className="h-3.5 w-3.5 text-slate-500" /> Việc chưa nhận ({unassignedPutawayTasks.length})
                  </TabsTrigger>
                </TabsList>

                {/* Putaway: My Tasks */}
                <TabsContent value="my-tasks" className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm mt-3">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow>
                      <TableHead className="text-[10px] uppercase font-bold pl-4">Task ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Số lượng</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Từ ô (Source)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Ô gợi ý (Suggested)</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {putawayTasks.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">Bạn không có nhiệm vụ putaway nào được gán.</TableCell></TableRow> : 
                        putawayTasks.map(t => (
                          <TableRow key={t.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => setCompletePutawayForm({...completePutawayForm, taskId: t.id})}>
                            <TableCell className="text-xs font-mono font-medium pl-4">{t.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-slate-700">{t.sku}</TableCell>
                            <TableCell className="text-xs text-center font-semibold text-slate-800">{t.quantity}</TableCell>
                            <TableCell className="text-xs text-center font-mono text-muted-foreground">{t.sourceBinId}</TableCell>
                            <TableCell className="text-xs text-center font-mono font-bold text-blue-600">{t.suggestedBinId}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Putaway: Unassigned */}
                <TabsContent value="unassigned" className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm mt-3">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow>
                      <TableHead className="text-[10px] uppercase font-bold pl-4">Task ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Số lượng</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Từ ô (Source)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Ô gợi ý (Suggested)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right pr-4">Hành động</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {unassignedPutawayTasks.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-xs py-8 text-muted-foreground">Không có công việc putaway nào đang chờ nhận.</TableCell></TableRow> : 
                        unassignedPutawayTasks.map(t => (
                          <TableRow key={t.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs font-mono pl-4">{t.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-slate-700">{t.sku}</TableCell>
                            <TableCell className="text-xs text-center font-semibold text-slate-800">{t.quantity}</TableCell>
                            <TableCell className="text-xs text-center font-mono text-muted-foreground">{t.sourceBinId}</TableCell>
                            <TableCell className="text-xs text-center font-mono text-blue-600">{t.suggestedBinId}</TableCell>
                            <TableCell className="text-right pr-4">
                              <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm" onClick={() => handleClaimPutaway(t.id)}>
                                Nhận việc
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Complete Scanner Panel */}
            <div className="w-full lg:w-80 border border-slate-200 bg-white shadow-sm rounded-xl h-fit">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 rounded-t-xl"><h3 className="text-xs font-bold uppercase text-slate-700">Máy Quét - Hoàn tất Cất hàng</h3></div>
              <div className="p-4 space-y-4">
                <div className="space-y-1"><Label className="text-xs font-semibold">Mã Công Việc (Task ID)</Label><Input className="h-9 text-xs font-mono" placeholder="Bấm chọn dòng task bên trái" value={completePutawayForm.taskId} onChange={e=>setCompletePutawayForm({...completePutawayForm,taskId:e.target.value})} /></div>
                <div className="space-y-1"><Label className="text-xs font-semibold">Ô Cất Hàng Thực Tế (Quét/Nhập Bin)</Label><Input className="h-9 text-xs font-mono border-blue-500 focus-visible:ring-blue-500" placeholder="Quét/Nhập mã ô cất thực tế" value={completePutawayForm.destBinCode} onChange={e=>setCompletePutawayForm({...completePutawayForm,destBinCode:e.target.value})} /></div>
                <Button className="w-full h-9 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm" onClick={handleCompletePutaway} disabled={!completePutawayForm.taskId || !completePutawayForm.destBinCode}><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Xác nhận cất hàng</Button>
              </div>
            </div>
          </TabsContent>

          {/* REPLENISHMENT TAB */}
          <TabsContent value="replenish" className="space-y-4 flex flex-col lg:flex-row gap-6">
             <div className="w-full lg:w-72 border border-slate-200 bg-white shadow-sm rounded-xl h-fit shrink-0">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 rounded-t-xl"><h3 className="text-xs font-bold uppercase text-slate-700">Tạo Công Việc Bồi Hàng</h3></div>
              <div className="p-4 space-y-3">
                <div className="space-y-1"><Label className="text-xs font-semibold">Tenant ID</Label><Input className="h-9 text-xs font-mono" value={genReplenishForm.tenantId} onChange={e=>setGenReplenishForm({...genReplenishForm,tenantId:e.target.value})} /></div>
                <div className="space-y-1"><Label className="text-xs font-semibold">Warehouse ID</Label><Input className="h-9 text-xs font-mono" value={genReplenishForm.warehouseId} onChange={e=>setGenReplenishForm({...genReplenishForm,warehouseId:e.target.value})} /></div>
                <Button className="w-full h-9 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white font-semibold shadow-sm" onClick={handleGenReplenish}><Plus className="h-3.5 w-3.5 mr-1.5" />Chạy thuật toán bồi hàng</Button>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <Tabs defaultValue="my-tasks" className="w-full">
                <TabsList className="h-8 bg-transparent p-0 gap-2 border-b border-slate-200 rounded-none w-full justify-start">
                  <TabsTrigger value="my-tasks" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-3 py-1 font-semibold flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-purple-600" /> Nhiệm vụ của tôi ({replenishTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="unassigned" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-600 data-[state=active]:bg-transparent px-3 py-1 font-semibold flex items-center gap-1.5">
                    <Inbox className="h-3.5 w-3.5 text-slate-500" /> Việc chưa nhận ({unassignedReplenishTasks.length})
                  </TabsTrigger>
                </TabsList>

                {/* Replenish: My Tasks */}
                <TabsContent value="my-tasks" className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm mt-3">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow>
                      <TableHead className="text-[10px] uppercase font-bold pl-4">Task ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Số lượng</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Di chuyển (Route)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right pr-4">Hành động</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {replenishTasks.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">Bạn không có nhiệm vụ bồi hàng nào được gán.</TableCell></TableRow> : 
                        replenishTasks.map(t => (
                          <TableRow key={t.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs font-mono pl-4">{t.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-slate-700">{t.sku}</TableCell>
                            <TableCell className="text-xs text-center font-semibold text-slate-800">{t.quantity}</TableCell>
                            <TableCell className="text-xs text-center"><div className="flex items-center justify-center gap-2"><span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-muted-foreground text-[11px]">{t.fromBinId}</span><ArrowRight className="h-3 w-3 text-muted-foreground"/><span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-bold">{t.toBinId}</span></div></TableCell>
                            <TableCell className="text-right pr-4"><Button size="sm" variant="outline" className="h-7 text-xs border-green-200 hover:bg-green-50 hover:text-green-700 font-medium" onClick={()=>handleCompleteReplenish(t.id)}>Hoàn tất</Button></TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Replenish: Unassigned */}
                <TabsContent value="unassigned" className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm mt-3">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow>
                      <TableHead className="text-[10px] uppercase font-bold pl-4">Task ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Số lượng</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">Di chuyển (Route)</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right pr-4">Hành động</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {unassignedReplenishTasks.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">Không có công việc bồi hàng nào đang chờ nhận.</TableCell></TableRow> : 
                        unassignedReplenishTasks.map(t => (
                          <TableRow key={t.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs font-mono pl-4">{t.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-slate-700">{t.sku}</TableCell>
                            <TableCell className="text-xs text-center font-semibold text-slate-800">{t.quantity}</TableCell>
                            <TableCell className="text-xs text-center"><div className="flex items-center justify-center gap-2"><span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-muted-foreground text-[11px]">{t.fromBinId}</span><ArrowRight className="h-3 w-3 text-muted-foreground"/><span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-bold">{t.toBinId}</span></div></TableCell>
                            <TableCell className="text-right pr-4">
                              <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm" onClick={() => handleClaimReplenish(t.id)}>
                                Nhận việc
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* CYCLE COUNT TAB */}
          <TabsContent value="cycle" className="space-y-4 flex flex-col lg:flex-row gap-6">
             <div className="w-full lg:w-72 space-y-4 shrink-0">
               <div className="border border-slate-200 bg-white shadow-sm rounded-xl h-fit">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 rounded-t-xl"><h3 className="text-xs font-bold uppercase text-slate-700">Tạo đợt kiểm kho</h3></div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1"><Label className="text-xs font-semibold">Warehouse ID</Label><Input className="h-9 text-xs font-mono" value={genCycleForm.warehouseId} onChange={e=>setGenCycleForm({...genCycleForm,warehouseId:e.target.value})} /></div>
                  <div className="space-y-1"><Label className="text-xs font-semibold">Số lượng Task tối đa</Label><Input type="number" className="h-9 text-xs font-mono" value={genCycleForm.maxTasks} onChange={e=>setGenCycleForm({...genCycleForm,maxTasks:Number(e.target.value)})} /></div>
                  <Button className="w-full h-9 text-xs bg-slate-800 text-white hover:bg-slate-700 font-semibold shadow-sm" onClick={handleGenCycleCount}><Plus className="h-3.5 w-3.5 mr-1.5" />Tạo Công Việc</Button>
                </div>
              </div>
              <div className="border border-slate-200 bg-white shadow-sm rounded-xl h-fit">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 rounded-t-xl"><h3 className="text-xs font-bold uppercase text-slate-700">Đếm Mù (Máy Quét)</h3></div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1"><Label className="text-xs font-semibold">Mã Công Việc (Task ID)</Label><Input className="h-9 text-xs font-mono" placeholder="Mã kiểm kho hoặc quét SKU" value={submitCycleForm.taskId} onChange={e=>setSubmitCycleForm({...submitCycleForm,taskId:e.target.value})} /></div>
                  <div className="space-y-1"><Label className="text-xs font-semibold">Số Lượng Đã Đếm</Label><Input type="number" className="h-9 text-xs font-mono" value={submitCycleForm.countedQty} onChange={e=>setSubmitCycleForm({...submitCycleForm,countedQty:Number(e.target.value)})} /></div>
                  <Button className="w-full h-9 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm" onClick={handleSubmitCycle}><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Nộp kết quả kiểm</Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <Tabs defaultValue="my-tasks" className="w-full">
                <TabsList className="h-8 bg-transparent p-0 gap-2 border-b border-slate-200 rounded-none w-full justify-start">
                  <TabsTrigger value="my-tasks" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent px-3 py-1 font-semibold flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-amber-600" /> Nhiệm vụ của tôi ({cycleTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="unassigned" className="text-xs h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-slate-600 data-[state=active]:bg-transparent px-3 py-1 font-semibold flex items-center gap-1.5">
                    <Inbox className="h-3.5 w-3.5 text-slate-500" /> Việc chưa nhận ({unassignedCycleTasks.length})
                  </TabsTrigger>
                </TabsList>

                {/* Cycle Count: My Tasks */}
                <TabsContent value="my-tasks" className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm mt-3">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow>
                      <TableHead className="text-[10px] uppercase font-bold pl-4">Task ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Bin Code</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">SL Dự Kiến</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">SL Đã Đếm</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Trạng thái</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right pr-4">Hành động</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {cycleTasks.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-xs py-8 text-muted-foreground">Bạn không có nhiệm vụ kiểm kho nào được gán.</TableCell></TableRow> : 
                        cycleTasks.map(t => (
                          <TableRow key={t.id} className="hover:bg-slate-50/50" onClick={() => setSubmitCycleForm({...submitCycleForm, taskId: t.id})}>
                            <TableCell className="text-xs font-mono pl-4">{t.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-xs font-mono">{t.binId}</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-slate-700">{t.sku}</TableCell>
                            <TableCell className="text-xs text-center text-muted-foreground font-semibold">{t.expectedQty}</TableCell>
                            <TableCell className="text-xs text-center font-bold text-blue-600">{t.countedQty ?? "—"}</TableCell>
                            <TableCell className="text-xs"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">{t.status}</span></TableCell>
                            <TableCell className="text-right pr-4">
                              {t.status === "Counted" ? (
                                <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 hover:bg-green-50 hover:text-green-700" onClick={(e) => { e.stopPropagation(); handleApproveCycle(t.id); }}>Phê duyệt</Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TabsContent>

                {/* Cycle Count: Unassigned */}
                <TabsContent value="unassigned" className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm mt-3">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow>
                      <TableHead className="text-[10px] uppercase font-bold pl-4">Task ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">Bin Code</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold">SKU</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-center">SL Dự Kiến</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-right pr-4">Hành động</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {unassignedCycleTasks.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-xs py-8 text-muted-foreground">Không có công việc kiểm kho nào đang chờ nhận.</TableCell></TableRow> : 
                        unassignedCycleTasks.map(t => (
                          <TableRow key={t.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-xs font-mono pl-4">{t.id.slice(0, 8)}...</TableCell>
                            <TableCell className="text-xs font-mono">{t.binId}</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-slate-700">{t.sku}</TableCell>
                            <TableCell className="text-xs text-center font-semibold text-slate-800">{t.expectedQty}</TableCell>
                            <TableCell className="text-right pr-4">
                              <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm" onClick={() => handleClaimCycleCount(t.id)}>
                                Nhận việc
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
