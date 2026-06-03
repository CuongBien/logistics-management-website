import { NextResponse } from 'next/server'
import { getSession } from "@/lib/auth"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    console.log('[PUT Permissions] Session exists:', !!session, 'Has token:', !!session?.accessToken)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    console.log('[PUT Permissions] Role ID:', id, 'PermissionIds count:', body?.permissionIds?.length)
    
    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Roles/${id}/Permissions`
    console.log('[PUT Permissions] Calling C# backend:', apiUrl)
    
    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    console.log('[PUT Permissions] C# backend response status:', res.status, res.statusText)

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`[PUT Permissions] Failed. Status: ${res.status}. Body:`, errorText)
      return NextResponse.json({ error: "Failed to update role permissions", details: errorText }, { status: res.status })
    }

    const responseText = await res.text()
    console.log('[PUT Permissions] Success. Body:', responseText.substring(0, 200))
    const data = responseText ? JSON.parse(responseText) : { isSuccess: true }
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[PUT Permissions] Exception:", error?.message, error?.stack)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
