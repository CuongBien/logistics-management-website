import { NextResponse } from 'next/server'
import { getSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Permissions`
    
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    if (!res.ok) {
      console.error("Failed to fetch permissions", await res.text())
      return NextResponse.json({ error: "Failed to fetch permissions" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Get Permissions Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
