import { NextResponse } from 'next/server'
import { getSession } from "@/lib/auth"
import { updateMockRolePermissions } from "@/lib/mock-rbac-db"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const body = await request.json()

    if (!session?.accessToken) {
      console.warn(`Unauthorized API call to update role ${params.id} permissions, updating in mock storage!`);
      return NextResponse.json(updateMockRolePermissions(params.id, body.permissionIds))
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Roles/${params.id}/Permissions`
    
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000)
      })

      if (!res.ok) {
        console.warn(`Failed to update role permissions in backend for ${params.id}, updating in mock storage as fallback!`, await res.text())
        return NextResponse.json(updateMockRolePermissions(params.id, body.permissionIds))
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error(`Failed to connect to Warehouse API to update role ${params.id} permissions, falling back to mock!`, fetchError)
      return NextResponse.json(updateMockRolePermissions(params.id, body.permissionIds))
    }
  } catch (error) {
    console.error("Update Role Permissions Global Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
