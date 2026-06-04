"use client"

import { useState, useEffect } from "react"
import { Settings as SettingsIcon, Key, Server, Shield, Wrench, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Textarea } from "@repo/ui/components/textarea"
import { toast } from "sonner"
import { checkHealth, getOmsUrl, getWmsUrl } from "@/lib/api-client"
import { fetchApi } from "@/lib/api-client"
import { useSession } from "next-auth/react"

export default function SettingsPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || ""
  const [omsHealth, setOmsHealth] = useState<boolean|null>(null)
  const [wmsHealth, setWmsHealth] = useState<boolean|null>(null)
  const [checking, setChecking] = useState(false)
  const [roleForm, setRoleForm] = useState({ warehouseId:"", operatorSub:"", roleCode:"manager" })



  const checkConnections = async () => {
    setChecking(true); setOmsHealth(null); setWmsHealth(null)
    const [oms, wms] = await Promise.all([checkHealth("oms"), checkHealth("wms")])
    setOmsHealth(oms); setWmsHealth(wms); setChecking(false)
  }

  const handleSetupAdmin = async () => {
    try {
      const r = await fetchApi<{message:string}>("wms", "/dev/account/setup-admin", { method: "POST" })
      toast.success(r?.message || "Admin rights granted")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const handleAssignRole = async () => {
    try {
      await fetchApi("wms", "/roleassignment", { method: "POST", body: roleForm })
      toast.success("Role assigned successfully")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
  }

  const HealthIcon = ({ status }: { status: boolean|null }) => {
    if (status === null) return <span className="h-3 w-3 bg-gray-300 inline-block" />
    return status ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted border-b border-border px-4 py-2">
        <h1 className="text-sm font-semibold flex items-center gap-2"><SettingsIcon className="h-4 w-4" /> Settings</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
          {/* API Connection */}
          <div className="border border-border bg-white">
            <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center gap-2"><Server className="h-3.5 w-3.5" /><h3 className="text-xs font-semibold uppercase">API Connection</h3></div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><HealthIcon status={omsHealth} /><span>Ordering API</span></div>
                <span className="font-mono text-[10px] text-muted-foreground">{getOmsUrl()}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><HealthIcon status={wmsHealth} /><span>Warehouse API</span></div>
                <span className="font-mono text-[10px] text-muted-foreground">{getWmsUrl()}</span>
              </div>
              <Button className="w-full h-8 text-xs" variant="outline" onClick={checkConnections} disabled={checking}>
                {checking ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Server className="h-3 w-3 mr-1" />}
                Test Connection
              </Button>
              <div className="text-[10px] text-muted-foreground border-t pt-2">
                <p>Keycloak: <a href="http://localhost:18080" target="_blank" className="text-blue-600 hover:underline font-mono">localhost:18080</a></p>
                <p>Realm: <span className="font-mono">logistics_realm</span> | Audience: <span className="font-mono">oms-client</span></p>
              </div>
            </div>
          </div>


          {/* Role Assignment */}
          <div className="border border-border bg-white">
            <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center gap-2"><Shield className="h-3.5 w-3.5" /><h3 className="text-xs font-semibold uppercase">Role Assignment</h3></div>
            <div className="p-4 space-y-3">
              <div><Label className="text-xs">Warehouse ID</Label><Input className="h-8 text-xs mt-1 font-mono" value={roleForm.warehouseId} onChange={e=>setRoleForm({...roleForm,warehouseId:e.target.value})} /></div>
              <div><Label className="text-xs">Operator Sub</Label><Input className="h-8 text-xs mt-1 font-mono" value={roleForm.operatorSub} onChange={e=>setRoleForm({...roleForm,operatorSub:e.target.value})} /></div>
              <div><Label className="text-xs">Role Code</Label><Input className="h-8 text-xs mt-1" value={roleForm.roleCode} onChange={e=>setRoleForm({...roleForm,roleCode:e.target.value})} /></div>
              <Button className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white" onClick={handleAssignRole}><Shield className="h-3 w-3 mr-1" />Assign Role</Button>
            </div>
          </div>

          {/* Dev Tools */}
          <div className="border border-border bg-white">
            <div className="bg-amber-500 text-white px-3 py-1.5 flex items-center gap-2"><Wrench className="h-3.5 w-3.5" /><h3 className="text-xs font-semibold uppercase">Dev Tools</h3></div>
            <div className="p-4 space-y-3">
              <p className="text-[10px] text-muted-foreground">Gán quyền Admin cho user hiện tại (JWT sub) tại tất cả warehouses. Chỉ dùng cho development.</p>
              <Button className="w-full h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSetupAdmin}><Wrench className="h-3 w-3 mr-1" />Setup Admin Rights</Button>
              <div className="text-[10px] text-muted-foreground border-t pt-2 space-y-1">
                <p>RabbitMQ: <a href="http://localhost:15672" target="_blank" className="text-blue-600 hover:underline font-mono">localhost:15672</a> (lms/lms123)</p>
                <p>Seq Logs: <a href="http://localhost:8081" target="_blank" className="text-blue-600 hover:underline font-mono">localhost:8081</a></p>
                <p>Jaeger: <a href="http://localhost:16686" target="_blank" className="text-blue-600 hover:underline font-mono">localhost:16686</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
