'use client';

import { useState, useEffect } from 'react';
import { OperatorDto } from '@/types/wms-rbac';
import { OperatorDataTable } from '@/components/wms/rbac/OperatorDataTable';
import { WarehouseProvider } from '@/components/wms/rbac/WarehouseContext';
import { WarehouseContextSelector } from '@/components/wms/rbac/WarehouseContextSelector';

export default function StaffPage() {
  const [operators, setOperators] = useState<OperatorDto[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <WarehouseProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhân sự & Phân quyền</h1>
            <p className="text-muted-foreground">
              Danh sách nhân viên và thiết lập vai trò thao tác tại các kho.
            </p>
          </div>
          <WarehouseContextSelector />
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <span className="text-muted-foreground">Đang tải danh sách nhân viên...</span>
          </div>
        ) : (
          <OperatorDataTable data={operators} onRoleAssigned={loadOperators} />
        )}
      </div>
    </WarehouseProvider>
  );
}
