"use client"

import { useState, useEffect } from "react"
import { Users, UserPlus, ShieldAlert, Trash2, Key, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { toast } from "sonner"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { getRoleAssignments, assignRole, unassignRole, getRoles, RoleAssignmentDto, RoleDto } from "@/lib/api/wms-identity"

export default function OperatorManagementPage() {
  const { activeWarehouseId } = useWarehouseContext()
  const [assignments, setAssignments] = useState<RoleAssignmentDto[]>([])
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [loading, setLoading] = useState(true)
  
  const [form, setForm] = useState({
    operatorSub: "",
    displayName: "",
    roleCode: ""
  })
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    if (!activeWarehouseId) return
    try {
      setLoading(true)
      const [list, rList] = await Promise.all([
        getRoleAssignments(),
        getRoles()
      ])
      // Filter assignments that belong to the active warehouse
      const filtered = list.filter(a => a.warehouseId === activeWarehouseId)
      setAssignments(filtered)
      setRoles(rList)
      if (rList.length > 0 && !form.roleCode) {
        setForm(prev => ({ ...prev, roleCode: rList[0].code }))
      }
    } catch (e) {
      console.error(e)
      toast.error("Không thể kết nối lấy dữ liệu phân quyền nhân sự")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeWarehouseId])

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWarehouseId) return
    if (!form.operatorSub.trim()) {
      toast.error("Vui lòng nhập định danh Operator ID (sub)")
      return
    }

    try {
      setSubmitting(true)
      await assignRole({
        warehouseId: activeWarehouseId,
        operatorSub: form.operatorSub.trim(),
        roleCode: form.roleCode,
        displayName: form.displayName.trim() || undefined
      })
      toast.success("Phân vai trò nhân viên thành công!")
      setForm({ operatorSub: "", displayName: "", roleCode: roles[0]?.code || "" })
      loadData()
    } catch (e) {
      console.error(e)
      toast.error("Gán vai trò thất bại")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnassign = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy vai trò này của nhân viên không?")) return
    try {
      await unassignRole(id)
      toast.success("Hủy phân quyền nhân sự thành công")
      loadData()
    } catch (e) {
      console.error(e)
      toast.error("Không thể hủy phân quyền")
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800">
      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-[#C41E3A]" />
          <h1 className="text-sm font-semibold text-slate-900">Quản Lý Phân Công Nhân Sự Kho (Operator Assignments)</h1>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-7 text-xs flex items-center gap-1">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Assign role form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4 text-[#C41E3A]" />
              Giao tác vụ & Vai trò mới
            </h2>
            
            <form onSubmit={handleAssign} className="space-y-3">
              <div>
                <Label className="text-xs">Operator ID (JWT sub / Username)</Label>
                <Input 
                  className="h-8 text-xs mt-1 font-mono" 
                  placeholder="e.g. staff1" 
                  value={form.operatorSub}
                  onChange={e => setForm({ ...form, operatorSub: e.target.value })}
                />
              </div>
              
              <div>
                <Label className="text-xs">Tên hiển thị (Tùy chọn)</Label>
                <Input 
                  className="h-8 text-xs mt-1" 
                  placeholder="e.g. Nguyễn Văn A" 
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs">Vai trò vận hành (WMS Role)</Label>
                <select 
                  className="w-full h-8 text-xs mt-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 outline-none focus:border-slate-400 font-medium"
                  value={form.roleCode}
                  onChange={e => setForm({ ...form, roleCode: e.target.value })}
                >
                  {roles.map(role => (
                    <option key={role.code} value={role.code}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
              </div>

              <Button 
                type="submit" 
                disabled={submitting || loading} 
                className="w-full h-8 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white flex items-center justify-center gap-1.5 mt-4"
              >
                {submitting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                Phân bổ nhân sự
              </Button>
            </form>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 leading-relaxed flex gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold mb-0.5">Phân quyền kho hàng (WMS RBAC):</h4>
              Nhân viên chỉ có thể thực hiện quét mã cất kệ, lấy hàng, hoặc kiểm kê nếu được gán đúng vai trò vận hành tương ứng tại Warehouse hiện tại.
            </div>
          </div>
        </div>

        {/* Right column: Operators list table */}
        <div className="lg:col-span-2 bg-white p-4 border border-slate-200 rounded-lg shadow-sm h-fit">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Nhân sự hiện tại trong chi nhánh</h2>

          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              Đang tải danh sách nhân viên...
            </div>
          ) : assignments.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 border border-dashed rounded-md">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              Chưa có nhân sự nào được phân quyền tại chi nhánh kho này.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Username / sub</TableHead>
                    <TableHead className="text-xs font-bold">Họ và Tên</TableHead>
                    <TableHead className="text-xs font-bold">Vai trò</TableHead>
                    <TableHead className="text-xs font-bold text-center w-[100px]">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs font-bold text-[#C41E3A]">
                        {assignment.operatorSub}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-900">
                        {assignment.displayName || "Nhân viên kho"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-100">
                          {assignment.roleCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          onClick={() => handleUnassign(assignment.id)} 
                          className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded"
                          title="Hủy gán vai trò"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
