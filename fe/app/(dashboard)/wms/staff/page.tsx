'use client';

import { useState, useEffect, useMemo } from 'react';
import { OperatorDto } from '@/types/wms-rbac';
import { OperatorDataTable } from '@/components/wms/rbac/OperatorDataTable';
import { WarehouseContextSelector } from '@/components/wms/rbac/WarehouseContextSelector';
import { CreateStaffDialog } from '@/components/wms/rbac/CreateStaffDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, Shield, ShieldAlert, RefreshCw, Search, Loader2, UserPlus
} from 'lucide-react';
import { usePermissions } from '@/components/wms/rbac/usePermissions';
import { AccessDeniedMessage } from '@/components/wms/rbac/AccessDeniedMessage';

export default function StaffPage() {
  const { hasPermissionInAnyWarehouse, loading: authLoading } = usePermissions();
  const [operators, setOperators] = useState<OperatorDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const loadOperators = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wms/users');
      if (res.ok) {
        const data = await res.json();
        setOperators(data);
      } else {
        console.error("Failed to load users", await res.text());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperators();
  }, []);

  // Derived stats
  const totalStaff = operators.length;
  const assignedStaff = operators.filter(op => op.roles.length > 0).length;
  const unassignedStaff = totalStaff - assignedStaff;
  const totalRoleAssignments = operators.reduce((sum, op) => sum + op.roles.length, 0);

  // Filtered data
  const filteredOperators = useMemo(() => {
    let result = operators;

    // Filter by assignment status
    if (filterStatus === 'assigned') {
      result = result.filter(op => op.roles.length > 0);
    } else if (filterStatus === 'unassigned') {
      result = result.filter(op => op.roles.length === 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(op =>
        op.fullName.toLowerCase().includes(q) ||
        op.email.toLowerCase().includes(q) ||
        op.username.toLowerCase().includes(q)
      );
    }

    return result;
  }, [operators, searchQuery, filterStatus]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
        <span className="ml-2 text-sm text-muted-foreground">Đang xác thực quyền truy cập...</span>
      </div>
    );
  }

  if (!hasPermissionInAnyWarehouse("role:manage")) {
    return <AccessDeniedMessage />;
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
              Quản lý Nhân sự & Phân quyền
            </h1>
            <p className="text-muted-foreground mt-1">
              Quản lý danh sách nhân viên kho, thiết lập vai trò và quyền hạn thao tác tại từng kho.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <WarehouseContextSelector />
            <Button
              variant="outline"
              size="sm"
              onClick={loadOperators}
              disabled={loading}
              className="font-medium flex items-center gap-1.5 h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="font-medium flex items-center gap-1.5 h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              Thêm Nhân viên
            </Button>
          </div>
        </div>

        {/* KPI Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Staff */}
          <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Tổng Nhân viên
              </CardTitle>
              <Users className="h-4.5 w-4.5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
                {loading ? '...' : totalStaff}
              </div>
              <CardDescription className="text-[11px] mt-1 text-muted-foreground">
                Toàn bộ nhân viên đã đăng ký trong hệ thống.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Assigned Staff */}
          <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Đã Phân quyền
              </CardTitle>
              <Shield className="h-4.5 w-4.5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                {loading ? '...' : assignedStaff}
              </div>
              <CardDescription className="text-[11px] mt-1 text-muted-foreground">
                Nhân viên đã được gán ít nhất 1 vai trò tại kho.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Unassigned Staff */}
          <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Chưa Phân quyền
              </CardTitle>
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                {loading ? '...' : unassignedStaff}
              </div>
              <CardDescription className="text-[11px] mt-1 text-muted-foreground">
                Nhân viên chưa có bất kỳ vai trò nào trong hệ thống.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Total Assignments */}
          <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-violet-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Tổng Lượt Gán Quyền
              </CardTitle>
              <UserPlus className="h-4.5 w-4.5 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold font-mono tracking-tight text-violet-600 dark:text-violet-400">
                {loading ? '...' : totalRoleAssignments}
              </div>
              <CardDescription className="text-[11px] mt-1 text-muted-foreground">
                Tổng số lượt gán vai trò (một nhân viên có thể có nhiều vai trò).
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar: Search + Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="staff-search"
              placeholder="Tìm kiếm theo tên, email hoặc username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-[200px] h-9 bg-background">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả nhân viên</SelectItem>
              <SelectItem value="assigned">Đã phân quyền</SelectItem>
              <SelectItem value="unassigned">Chưa phân quyền</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || filterStatus !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              Xóa bộ lọc
            </Button>
          )}
          <div className="ml-auto">
            <Badge variant="outline" className="text-xs font-mono">
              {filteredOperators.length} / {totalStaff} nhân viên
            </Badge>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <OperatorDataTable data={filteredOperators} onRoleAssigned={loadOperators} />
        )}

        {/* Create Staff Dialog */}
        <CreateStaffDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={loadOperators}
        />
      </div>
  );
}
