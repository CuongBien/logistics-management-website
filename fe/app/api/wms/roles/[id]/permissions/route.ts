import { NextResponse } from 'next/server'
import { getSession } from "@/lib/auth"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Roles/${params.id}/Permissions`
    
    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      console.error("Failed to update role permissions", await res.text())
      return NextResponse.json({ error: "Failed to update role permissions" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Update Role Permissions Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
