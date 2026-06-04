'use client';

import { ReactNode } from 'react';
import { usePermissions } from './usePermissions';
import { useWarehouseContext } from './WarehouseContext';

interface RequirePermissionProps {
  children: ReactNode;
  permission?: string;
  role?: string;
  fallback?: ReactNode;
}

export function RequirePermission({ children, permission, role, fallback = null }: RequirePermissionProps) {
  const { hasPermission, hasRole, loading } = usePermissions();
  const { activeWarehouseId } = useWarehouseContext();

  if (loading) {
    return null; // Or show loading state if preferred
  }

  let allowed = true;

  if (permission && activeWarehouseId) {
    allowed = hasPermission(permission, activeWarehouseId);
  } else if (role && activeWarehouseId) {
    allowed = hasRole(role, activeWarehouseId);
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
