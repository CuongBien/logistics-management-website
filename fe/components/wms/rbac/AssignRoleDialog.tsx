'use client';

import { useState, useEffect } from 'react';
import { OperatorDto, RoleDto } from '@/types/wms-rbac';
import { fetchApi } from '@/lib/api-client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import {
  ShieldPlus, Warehouse, UserCog, Loader2, CheckCircle2, AlertTriangle, Trash2, X
} from 'lucide-react';

interface AssignRoleDialogProps {
  operator: OperatorDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AssignRoleDialog({ operator, open, onOpenChange, onSuccess }: AssignRoleDialogProps) {
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleCode, setRoleCode] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Try to use shadcn toast, fallback to sonner
  let toastFn: any;
  try {
    const { toast } = useToast();
    toastFn = toast;
  } catch {
    toastFn = null;
  }

  const showToast = (title: string, description: string, variant?: 'destructive') => {
    if (toastFn) {
      toastFn({ title, description, variant });
    } else {
      if (variant === 'destructive') {
        sonnerToast.error(`${title}: ${description}`);
      } else {
        sonnerToast.success(`${title}: ${description}`);
      }
    }
  };

  const handleUnassign = async (assignmentId: string, roleName: string) => {
    if (!assignmentId) return;
    
    setDeletingId(assignmentId);
    try {
      const res = await fetch(`/api/wms/users?id=${assignmentId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        showToast('Thành công', `Đã gỡ vai trò ${roleName} khỏi nhân viên.`);
        onSuccess();
      } else {
        const data = await res.json();
        showToast('Thất bại', data.details || 'Có lỗi xảy ra khi gỡ vai trò.', 'destructive');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Thất bại', 'Lỗi hệ thống khi gỡ vai trò.', 'destructive');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (open) {
      setRoleCode('');
      setWarehouseId('');

      const loadWarehouses = async () => {
        try {
          const res = await fetchApi<any>('wms', '/Warehouse?all=true');
          let list: any[] = [];
          if (res) {
            if (res.isSuccess && Array.isArray(res.value)) {
              list = res.value;
            } else if (Array.isArray(res)) {
              list = res;
            }
          }
          setWarehouses(list);
          if (list.length > 0) {
            setWarehouseId(list[0].id);
          }
        } catch (e) {
          console.error("Failed to load warehouses from live API", e);
          setWarehouses([]);
          showToast('Lỗi', 'Không thể kết nối đến máy chủ WMS để tải danh sách Kho', 'destructive');
        }
      };

      const loadRoles = async () => {
        try {
          const res = await fetch('/api/wms/roles');
          const data = await res.json();
          if (data && data.isSuccess && Array.isArray(data.value)) {
            setRoles(data.value);
          } else if (data && Array.isArray(data)) {
            setRoles(data);
          } else {
            throw new Error("Invalid roles response format");
          }
        } catch (e) {
          console.error("Failed to load roles from API", e);
          setRoles([]);
          showToast('Lỗi', 'Không thể tải danh sách Vai trò từ hệ thống', 'destructive');
        }
      };

      loadWarehouses();
      loadRoles();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!roleCode || !warehouseId) {
      showToast('Lỗi', 'Vui lòng chọn Kho và Vai trò', 'destructive');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('wms', '/RoleAssignment', {
        method: 'POST',
        body: {
          operatorSub: operator.operatorSub,
          roleCode: roleCode,
          warehouseId: warehouseId,
          displayName: operator.fullName,
        },
      });

      if (res && (res as any).isSuccess) {
        showToast('Thành công', `Đã gán quyền cho ${operator.fullName} thành công.`);
        onSuccess();
        onOpenChange(false);
      } else {
        showToast('Thất bại', 'Có lỗi xảy ra khi phân quyền.', 'destructive');
      }
    } catch (e) {
      console.error(e);
      showToast('Thất bại', 'Lỗi hệ thống, vui lòng thử lại.', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  const selectedWarehouse = warehouses.find(w => w.id === warehouseId);
  const selectedRole = roles.find(r => r.code === roleCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldPlus className="h-5 w-5 text-primary" />
            Phân quyền Nhân sự
          </DialogTitle>
          <DialogDescription>
            Gán vai trò thao tác cho nhân viên tại một kho cụ thể trong hệ thống WMS.
          </DialogDescription>
        </DialogHeader>

        {/* Operator Info Card */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {getInitials(operator.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-foreground">{operator.fullName}</div>
            <div className="text-xs text-muted-foreground">{operator.email}</div>
          </div>
          {operator.roles.length > 0 && (
            <Badge variant="outline" className="shrink-0 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {operator.roles.length} quyền
            </Badge>
          )}
        </div>

        {/* Current Roles Preview */}
        {operator.roles.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Quyền hiện tại (Nhấn X để gỡ quyền):</Label>
            <div className="flex flex-wrap gap-1">
              {operator.roles.map((r, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="text-xs font-medium pl-2.5 pr-1 py-0.5 flex items-center gap-1 bg-muted/75 text-foreground hover:bg-muted"
                >
                  <span>{r.roleName} @ {r.warehouseName || r.warehouseId.split('-')[0]}</span>
                  {r.id && (
                    <button
                      type="button"
                      onClick={() => handleUnassign(r.id!, r.roleName)}
                      disabled={deletingId !== null}
                      className="ml-1 p-0.5 rounded-full hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
                      title="Gỡ vai trò này"
                    >
                      {deletingId === r.id ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin text-destructive" />
                      ) : (
                        <X className="h-2.5 w-2.5" />
                      )}
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="grid gap-4 pt-2">
          <div className="grid gap-2">
            <Label htmlFor="warehouse" className="flex items-center gap-1.5 text-sm font-medium">
              <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
              Chọn Kho (Warehouse)
            </Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger id="warehouse" className="h-10">
                <SelectValue placeholder="Chọn kho..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                      {w.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role" className="flex items-center gap-1.5 text-sm font-medium">
              <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
              Vai trò (Role)
            </Label>
            <Select value={roleCode} onValueChange={setRoleCode}>
              <SelectTrigger id="role" className="h-10">
                <SelectValue placeholder="Chọn vai trò..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                      {r.name}
                      <span className="text-muted-foreground">({r.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Preview */}
        {selectedWarehouse && selectedRole && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-sm">
            <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">
              Sẽ gán vai trò <strong className="text-foreground">{selectedRole.name}</strong> cho{' '}
              <strong className="text-foreground">{operator.fullName}</strong> tại kho{' '}
              <strong className="text-foreground">{selectedWarehouse.name}</strong>.
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !roleCode || !warehouseId}
            className="bg-primary hover:bg-primary/90 font-semibold min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Đang lưu...
              </>
            ) : (
              <>
                <ShieldPlus className="h-4 w-4 mr-1.5" />
                Lưu quyền
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
