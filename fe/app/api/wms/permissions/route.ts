import { NextResponse } from 'next/server'
import { getSession } from "@/lib/auth"
import { getMockPermissions } from "@/lib/mock-rbac-db"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.accessToken) {
      console.warn("Unauthorized API call to permissions, returning mock permissions for dev/demo!");
      return NextResponse.json(getMockPermissions())
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Permissions`
    
    try {
      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        signal: AbortSignal.timeout(3000)
      })

      if (!res.ok) {
        console.warn("Warehouse API returned error for permissions, falling back to mock!");
        return NextResponse.json(getMockPermissions())
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error("Failed to connect to Warehouse API for permissions, falling back to mock!", fetchError)
      return NextResponse.json(getMockPermissions())
    }
  } catch (error) {
    console.error("Get Permissions Global Error:", error)
    return NextResponse.json(getMockPermissions())
  }
}
