export interface PermissionDto {
  id: string;
  code: string;
  resource: string;
  action: string;
}

export interface RoleDto {
  id: string;
  code: string;
  name: string;
  permissions: PermissionDto[];
}

export interface AssignRoleRequest {
  operatorSub: string;
  roleId: string; // Used to be roleName, but now we use roleId or roleCode depending on backend
  warehouseId: string;
}

export interface OperatorDto {
  operatorSub: string;
  fullName: string;
  email: string;
  username: string;
  phone?: string;
  employeeCode?: string;
  roles: {
    id?: string;
    warehouseId: string;
    warehouseName: string;
    roleName: string;
    roleCode?: string;
  }[];
}
