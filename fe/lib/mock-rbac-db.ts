export interface PermissionDto {
  id: string;
  code: string;
  resource: string;
  action: string;
}

export interface RoleDto {
  id: string;
  name: string;
  code: string;
  permissions: PermissionDto[];
}

export interface RoleAssignmentDto {
  warehouseId: string;
  warehouseName: string;
  roleName: string;
}

export interface OperatorDto {
  operatorSub: string;
  fullName: string;
  email: string;
  username: string;
  roles: RoleAssignmentDto[];
}

// Persisted lists in global Node.js context (survives hot-reloads)
const globalRef = global as any;

if (!globalRef.mockPermissions) {
  globalRef.mockPermissions = [
    { id: "00000000-0000-0000-0000-000000000025", action: "putaway", code: "inbound:putaway", resource: "inbound" },
    { id: "00000000-0000-0000-0000-000000000007", action: "transit_receive", code: "inbound:transit_receive", resource: "inbound" },
    { id: "00000000-0000-0000-0000-000000000008", action: "create", code: "outbound:create", resource: "outbound" },
    { id: "00000000-0000-0000-0000-000000000009", action: "allocate", code: "outbound:allocate", resource: "outbound" },
    { id: "00000000-0000-0000-0000-000000000010", action: "pick", code: "outbound:pick", resource: "outbound" },
    { id: "00000000-0000-0000-0000-000000000011", action: "pack", code: "outbound:pack", resource: "outbound" },
    { id: "00000000-0000-0000-0000-000000000012", action: "load", code: "outbound:load", resource: "outbound" },
    { id: "00000000-0000-0000-0000-000000000013", action: "dispatch", code: "outbound:dispatch", resource: "outbound" },
    { id: "00000000-0000-0000-0000-000000000014", action: "manage", code: "route:manage", resource: "route" },
    { id: "00000000-0000-0000-0000-000000000015", action: "reconcile", code: "inventory:reconcile", resource: "inventory" },
    { id: "00000000-0000-0000-0000-000000000020", action: "transfer", code: "inventory:transfer", resource: "inventory" }
  ];
}

if (!globalRef.mockRoles) {
  globalRef.mockRoles = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Quản lý Kho (Warehouse Manager)",
      code: "warehouse_manager",
      permissions: [
        globalRef.mockPermissions[0],
        globalRef.mockPermissions[4],
        globalRef.mockPermissions[9]
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Nhân viên kiểm kho (Cycle Counter)",
      code: "cycle_counter",
      permissions: [
        globalRef.mockPermissions[9]
      ]
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Nhân viên lấy hàng (Picker)",
      code: "picker",
      permissions: [
        globalRef.mockPermissions[4]
      ]
    }
  ];
}

if (!globalRef.mockUsers) {
  globalRef.mockUsers = [
    {
      operatorSub: "user-admin-sub",
      fullName: "Nguyễn Văn Admin",
      email: "admin@best-inc.com.vn",
      username: "admin",
      roles: [
        {
          warehouseId: "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
          warehouseName: "HCM Mega Hub (WH-SG-002)",
          roleName: "Quản lý Kho (Warehouse Manager)"
        }
      ]
    },
    {
      operatorSub: "user-van-sub",
      fullName: "Trần Thị Vân",
      email: "van.tran@best-inc.com.vn",
      username: "vantran",
      roles: [
        {
          warehouseId: "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
          warehouseName: "HCM Mega Hub (WH-SG-002)",
          roleName: "Nhân viên kiểm kho (Cycle Counter)"
        }
      ]
    },
    {
      operatorSub: "user-khoa-sub",
      fullName: "Nguyễn Văn Khoa",
      email: "khoa.nguyen@best-inc.com.vn",
      username: "khoanguyen",
      roles: []
    },
    {
      operatorSub: "user-shipper-sub",
      fullName: "Lê Minh Quốc",
      email: "quoc.le@best-inc.com.vn",
      username: "quocle",
      roles: []
    }
  ];
}

export const mockPermissionsList = globalRef.mockPermissions as PermissionDto[];
export const mockRolesList = globalRef.mockRoles as RoleDto[];
export const mockUsersList = globalRef.mockUsers as OperatorDto[];

export function getMockPermissions() {
  return { isSuccess: true, value: mockPermissionsList };
}

export function getMockRoles() {
  return { isSuccess: true, value: mockRolesList };
}

export function getMockUsers() {
  return mockUsersList;
}

export function createMockRole(name: string, code: string, permissionIds: string[]) {
  const newRole: RoleDto = {
    id: `mock-role-${Date.now()}`,
    name,
    code,
    permissions: mockPermissionsList.filter(p => permissionIds.includes(p.id))
  };
  mockRolesList.push(newRole);
  return { isSuccess: true, value: newRole };
}

export function updateMockRolePermissions(roleId: string, permissionIds: string[]) {
  const role = mockRolesList.find(r => r.id === roleId || r.code === roleId);
  if (role) {
    role.permissions = mockPermissionsList.filter(p => permissionIds.includes(p.id));
    return { isSuccess: true, value: role.id };
  }
  return { isSuccess: false, error: { message: "Role not found" } };
}

export function assignMockRole(operatorSub: string, roleCode: string, warehouseId: string) {
  const user = mockUsersList.find(u => u.operatorSub === operatorSub);
  const role = mockRolesList.find(r => r.code === roleCode);
  
  const warehouseNames: Record<string, string> = {
    "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1": "HCM Mega Hub (WH-SG-002)",
    "e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5": "Hanoi Mega Hub (WH-HN-006)",
    "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3": "Da Nang Sorting Center (WH-DN-004)",
    "b61a8f61-5238-4a18-809c-335cc293a025": "Can Tho Delivery Hub (WH-CT-001)"
  };
  
  if (user && role) {
    const newAssignment = {
      warehouseId,
      warehouseName: warehouseNames[warehouseId] || "Kho chính",
      roleName: role.name
    };
    // Clean old assignment for same warehouse if it exists
    user.roles = user.roles.filter(r => r.warehouseId !== warehouseId);
    user.roles.push(newAssignment);
    return { isSuccess: true };
  }
  return { isSuccess: false };
}
