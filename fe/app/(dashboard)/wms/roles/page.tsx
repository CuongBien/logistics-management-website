'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoleDto, PermissionDto } from '@/types/wms-rbac';
import { Plus, Edit } from 'lucide-react';
import { RoleDialog } from './components/RoleDialog';

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDto | undefined>();

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/wms/roles'),
        fetch('/api/wms/permissions')
      ]);

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();

      // Parse Roles
      if (rolesData) {
        if (rolesData.isSuccess && Array.isArray(rolesData.value)) {
          setRoles(rolesData.value);
        } else if (Array.isArray(rolesData)) {
          setRoles(rolesData);
        }
      }

      // Parse Permissions
      if (permsData) {
        if (permsData.isSuccess && Array.isArray(permsData.value)) {
          setPermissions(permsData.value);
        } else if (Array.isArray(permsData)) {
          setPermissions(permsData);
        }
      }
    } catch (e) {
      console.error("Failed to load roles or permissions:", e);
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
                <TableHead className="w-[100px]">Thao tác</TableHead>
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
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
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
        onSuccess={loadData}
      />
    </div>
  );
}
