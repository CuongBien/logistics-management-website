import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface WarehousePermission {
  warehouseId: string;
  zoneId: string | null;
  permissionCode: string;
}

export interface UserRoleAssignment {
  warehouseId: string;
  roleCode: string;
}

export function usePermissions() {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [warehousePermissions, setWarehousePermissions] = useState<WarehousePermission[]>([]);
  const [roles, setRoles] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchPermissions() {
      try {
        const res = await fetch('/api/wms/my-permissions');
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setPermissions(data.permissions || []);
            setWarehousePermissions(data.warehousePermissions || []);
            setRoles(data.roles || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user permissions:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const isSystemAdmin = session?.user?.name === 'admin' || session?.user?.email?.startsWith('admin@');
  const hasWmsAccess = isSystemAdmin || permissions.length > 0 || roles.length > 0 || warehousePermissions.length > 0;

  const hasPermission = (permissionCode: string, warehouseId: string) => {
    // Admin user override
    if (isSystemAdmin) return true;
    return warehousePermissions.some(
      (p) => p.permissionCode === permissionCode && p.warehouseId === warehouseId
    );
  };

  const hasRole = (roleCode: string, warehouseId: string) => {
    if (isSystemAdmin) return true;
    return roles.some(
      (r) => r.roleCode === roleCode && r.warehouseId === warehouseId
    );
  };

  const hasPermissionInAnyWarehouse = (permissionCode: string) => {
    if (isSystemAdmin) return true;
    return permissions.includes(permissionCode);
  };

  return {
    permissions,
    warehousePermissions,
    roles,
    loading,
    hasPermission,
    hasRole,
    hasPermissionInAnyWarehouse,
    isSystemAdmin,
    hasWmsAccess,
  };
}
