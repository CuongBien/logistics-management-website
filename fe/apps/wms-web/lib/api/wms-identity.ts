import { fetchApi } from "@/lib/api-client";

export interface RoleAssignmentDto {
  id: string;
  operatorProfileId: string;
  operatorSub: string;
  displayName: string;
  roleId: string;
  roleCode: string;
  warehouseId: string;
  zoneId?: string;
  status: string;
}

export interface RoleDto {
  id: string;
  code: string;
  name: string;
}

export async function getRoleAssignments(): Promise<RoleAssignmentDto[]> {
  try {
    const res = await fetchApi<any>("wms", "/RoleAssignment");
    return res?.value || res || [];
  } catch (err) {
    console.error("Failed to fetch role assignments:", err);
    return [];
  }
}

export async function assignRole(data: { warehouseId: string; operatorSub: string; roleCode: string; displayName?: string }): Promise<any> {
  return await fetchApi<any>("wms", "/RoleAssignment", {
    method: "POST",
    body: data
  });
}

export async function unassignRole(id: string): Promise<any> {
  return await fetchApi<any>("wms", `/RoleAssignment/${id}`, {
    method: "DELETE"
  });
}

export async function getRoles(): Promise<RoleDto[]> {
  try {
    const res = await fetchApi<any>("wms", "/RoleAssignment/Roles");
    return res?.value || res || [];
  } catch (err) {
    console.error("Failed to fetch roles:", err);
    return [];
  }
}
