import { NextResponse } from 'next/server'
import { getSession } from "@/lib/auth"
import { getMockRoles, createMockRole } from "@/lib/mock-rbac-db"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.accessToken) {
      console.warn("Unauthorized API call to roles, returning mock roles for dev/demo!");
      return NextResponse.json(getMockRoles())
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Roles`
    
    try {
      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        signal: AbortSignal.timeout(3000)
      })

      if (!res.ok) {
        console.warn("Warehouse API returned error for roles, falling back to mock!");
        return NextResponse.json(getMockRoles())
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error("Failed to connect to Warehouse API for roles, falling back to mock!", fetchError)
      return NextResponse.json(getMockRoles())
    }
  } catch (error) {
    console.error("Get Roles Global Error:", error)
    return NextResponse.json(getMockRoles())
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    const body = await request.json()

    if (!session?.accessToken) {
      console.warn("Unauthorized API call to create role, creating in mock storage!");
      return NextResponse.json(createMockRole(body.name, body.code, body.permissionIds))
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Roles`
    
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000)
      })

      if (!res.ok) {
        console.warn("Failed to create role in backend, creating in mock storage as fallback!", await res.text())
        return NextResponse.json(createMockRole(body.name, body.code, body.permissionIds))
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error("Failed to connect to Warehouse API to create role, falling back to mock storage!", fetchError)
      return NextResponse.json(createMockRole(body.name, body.code, body.permissionIds))
    }
  } catch (error) {
    console.error("Create Role Global Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
