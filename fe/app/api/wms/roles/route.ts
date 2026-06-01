import { NextResponse } from 'next/server'
import { getSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Roles`
    
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    if (!res.ok) {
      console.error("Failed to fetch roles from WMS C# backend", await res.text())
      return NextResponse.json({ error: "Failed to fetch roles" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Get Roles Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Roles`
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) {
      console.error("Failed to create role in WMS C# backend", await res.text())
      return NextResponse.json({ error: "Failed to create role" }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Create Role Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
