import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { RoleDto, PermissionDto } from '@/types/wms-rbac';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleDto;
  allPermissions: PermissionDto[];
  existingRoles?: RoleDto[];
  onSuccess: () => void;
}

export function RoleDialog({ open, onOpenChange, role, allPermissions, existingRoles, onSuccess }: RoleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  const isEdit = !!role;

  useEffect(() => {
    if (open) {
      if (isEdit && role) {
        setName(role.name);
        setCode(role.code);
        setSelectedPerms(new Set(role.permissions.map(p => p.id)));
      } else {
        setName('');
        
        // Auto-generate code in WMS_xx format
        const prefix = 'WMS_';
        let maxNum = 0;
        if (existingRoles) {
          existingRoles.forEach(r => {
            if (r.code && r.code.toUpperCase().startsWith(prefix)) {
              const numStr = r.code.slice(prefix.length);
              const num = parseInt(numStr, 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          });
        }
        const nextNum = maxNum + 1;
        const nextCode = `${prefix}${String(nextNum).padStart(2, '0')}`;
        setCode(nextCode);
        setSelectedPerms(new Set());
      }
    }
  }, [open, role, isEdit, existingRoles]);

  const handleTogglePerm = (permId: string) => {
    const newSet = new Set(selectedPerms);
    if (newSet.has(permId)) {
      newSet.delete(permId);
    } else {
      newSet.add(permId);
    }
    setSelectedPerms(newSet);
  };

  const handleSubmit = async () => {
    if (!name || !code) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập Tên và Mã Role', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      if (!isEdit) {
        // Create Role
        const res = await fetch('/api/wms/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            code,
            permissionIds: Array.from(selectedPerms)
          })
        });
        const responseText = await res.text();
        const data = responseText ? JSON.parse(responseText) : {};
        if (data.isSuccess || res.ok) {
          toast({ title: 'Thành công', description: 'Đã tạo Role mới' });
          onSuccess();
          onOpenChange(false);
        } else {
          const errorMsg = typeof data.error === 'object' ? data.error?.message : (data.error || data.details || 'Có lỗi xảy ra');
          toast({ title: 'Lỗi', description: errorMsg, variant: 'destructive' });
        }
      } else {
        // Edit Permissions
        const res = await fetch(`/api/wms/roles/${role.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permissionIds: Array.from(selectedPerms)
          })
        });
        const responseText = await res.text();
        const data = responseText ? JSON.parse(responseText) : {};
        if (data.isSuccess || res.ok) {
          toast({ title: 'Thành công', description: 'Đã cập nhật quyền cho Role' });
          onSuccess();
          onOpenChange(false);
        } else {
          const errorMsg = typeof data.error === 'object' ? data.error?.message : (data.error || data.details || 'Có lỗi xảy ra');
          toast({ title: 'Lỗi', description: errorMsg, variant: 'destructive' });
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Lỗi', description: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Group permissions by resource for better UI
  const groupedPerms = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, PermissionDto[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Cập nhật Quyền Vai trò' : 'Tạo Vai trò mới'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Chỉnh sửa danh sách quyền hạn cho vai trò này.' : 'Định nghĩa một vai trò mới và phân quyền tương ứng.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên Role</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} disabled={isEdit} placeholder="Vd: Quản lý Kho" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Mã Role (Tự động)</Label>
              <Input id="code" value={code} disabled={true} className="bg-muted" />
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-base font-semibold">Quyền hạn (Permissions)</Label>
            <div className="mt-2 space-y-6">
              {Object.entries(groupedPerms).map(([resource, perms]) => (
                <div key={resource} className="border rounded-md p-4 bg-muted/20">
                  <h4 className="font-medium capitalize text-primary mb-3">{resource}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {perms.map(p => (
                      <div key={p.id} className="flex items-start space-x-2">
                        <Checkbox 
                          id={`perm-${p.id}`} 
                          checked={selectedPerms.has(p.id)}
                          onCheckedChange={() => handleTogglePerm(p.id)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`perm-${p.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {p.action}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {p.code}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo Role')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
