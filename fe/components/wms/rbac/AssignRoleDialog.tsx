import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { OperatorDto, RoleDto } from '@/types/wms-rbac';
import { fetchApi } from '@/lib/api-client';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface AssignRoleDialogProps {
  operator: OperatorDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AssignRoleDialog({ operator, open, onOpenChange, onSuccess }: AssignRoleDialogProps) {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleCode, setRoleCode] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');

  useEffect(() => {
    if (open) {
      // Fetch warehouses
      const loadWarehouses = async () => {
        try {
          const res = await fetchApi<{ isSuccess: boolean; value: any[] }>('wms', '/Warehouse');
          if (res && res.isSuccess) {
            setWarehouses(res.value);
            if (res.value.length > 0) {
              setWarehouseId(res.value[0].id);
            }
          }
        } catch (e) {
          console.error("Failed to load warehouses", e);
        }
      };
      
      const loadRoles = async () => {
        try {
          const res = await fetch('/api/wms/roles');
          const data = await res.json();
          if (data && data.isSuccess) {
            setRoles(data.value);
          }
        } catch (e) {
          console.error("Failed to load roles", e);
        }
      };

      loadWarehouses();
      loadRoles();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!roleCode || !warehouseId) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn Kho và Vai trò', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi('wms', '/RoleAssignment', {
        method: 'POST',
        body: JSON.stringify({
          operatorSub: operator.operatorSub,
          roleCode: roleCode, // changed from roleName
          warehouseId: warehouseId,
        }),
      });

      if (res && (res as any).isSuccess) {
        toast({ title: 'Thành công', description: 'Đã phân quyền thành công' });
        onSuccess();
      } else {
        toast({ title: 'Thất bại', description: 'Có lỗi xảy ra khi phân quyền', variant: 'destructive' });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Thất bại', description: 'Lỗi hệ thống', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Phân quyền Nhân sự</DialogTitle>
          <DialogDescription>
            Gán quyền thao tác cho nhân viên <b>{operator.fullName}</b> tại một kho cụ thể.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="warehouse">Chọn Kho (Warehouse)</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Chọn kho..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Vai trò (Role)</Label>
            <Select value={roleCode} onValueChange={setRoleCode}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Chọn vai trò..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.name} ({r.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu quyền'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
