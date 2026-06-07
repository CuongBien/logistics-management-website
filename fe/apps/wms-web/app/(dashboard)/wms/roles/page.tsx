'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/table';
import { RoleDto, PermissionDto } from '@/types/wms-rbac';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { RoleDialog } from './components/RoleDialog';
import { toast as sonnerToast } from 'sonner';
import { usePermissions } from '@/components/wms/rbac/usePermissions';
import { AccessDeniedMessage } from '@/components/wms/rbac/AccessDeniedMessage';
import { useWarehouseContext } from '@/components/wms/rbac/WarehouseContext';

export default function RolesPage() {
  const { hasPermission, isSystemAdmin, loading: authLoading } = usePermissions();
  const { activeWarehouseId } = useWarehouseContext();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (useEffects and other definitions will follow, let's inject checks at the return statement or directly at the top)

  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDto | undefined>();

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/wms/roles'),
        fetch('/api/wms/permissions')
      ]);

      let rolesData = null;
      let permsData = null;

      try {
        rolesData = await rolesRes.json();
      } catch (e) {
        console.error("Failed to parse roles JSON", e);
      }

      try {
        permsData = await permsRes.json();
      } catch (e) {
        console.error("Failed to parse permissions JSON", e);
      }

      if (!rolesRes.ok) {
        sonnerToast.error(`Lỗi tải Vai trò (Roles): Mã lỗi ${rolesRes.status}. Chi tiết: ${rolesData?.details || rolesData?.error || 'Không thể kết nối đến WMS backend'}`);
      } else if (rolesData) {
        if (rolesData.isSuccess && Array.isArray(rolesData.value)) {
          setRoles(rolesData.value);
        } else if (Array.isArray(rolesData)) {
          setRoles(rolesData);
        }
      }

      if (!permsRes.ok) {
        sonnerToast.error(`Lỗi tải Quyền hạn (Permissions): Mã lỗi ${permsRes.status}. Chi tiết: ${permsData?.details || permsData?.error || 'Không thể kết nối đến WMS backend'}`);
      } else if (permsData) {
        if (permsData.isSuccess && Array.isArray(permsData.value)) {
          setPermissions(permsData.value);
        } else if (Array.isArray(permsData)) {
          setPermissions(permsData);
        }
      }
    } catch (e: any) {
      console.error("Failed to load roles or permissions:", e);
      sonnerToast.error(`Lỗi kết nối: Không thể tải dữ liệu: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    setSelectedRole(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (role: RoleDto) => {
    setSelectedRole(role);
    setDialogOpen(true);
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${roleName}"? Hành động này sẽ gỡ bỏ vai trò này khỏi tất cả nhân sự đang đảm nhiệm.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/wms/roles/${roleId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        sonnerToast.success(`Đã xóa vai trò "${roleName}" thành công.`);
        loadData();
      } else {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        const errorMsg = typeof data.error === 'object' ? data.error?.message : (data.error || data.details || 'Có lỗi xảy ra');
        sonnerToast.error(`Lỗi xóa vai trò: ${errorMsg}`);
      }
    } catch (e: any) {
      console.error(e);
      sonnerToast.error(`Lỗi hệ thống khi xóa vai trò: ${e.message}`);
    }
  };

  const hasAccess = isSystemAdmin || (activeWarehouseId ? hasPermission("role:manage", activeWarehouseId) : false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
        <span className="ml-2 text-sm text-muted-foreground">Đang xác thực quyền truy cập...</span>
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDeniedMessage />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Vai trò (Roles)</h1>
          <p className="text-muted-foreground mt-2">
            Định nghĩa các vai trò trong kho và cấp phát quyền hạn (Permissions) tương ứng.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> Tạo Vai trò mới
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Roles</CardTitle>
          <CardDescription>Các vai trò hiện có trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Role</TableHead>
                <TableHead>Mã (Code)</TableHead>
                <TableHead>Số lượng Quyền</TableHead>
                <TableHead className="w-[120px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Đang tải...</TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Không có dữ liệu</TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.code}</TableCell>
                    <TableCell>{role.permissions?.length || 0} quyền</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(role)} title="Chỉnh sửa vai trò">
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      {role.id && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id!, role.name)} title="Xóa vai trò">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={selectedRole}
        allPermissions={permissions}
        existingRoles={roles}
        onSuccess={loadData}
      />
    </div>
  );
}
