import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/MyPermissions`
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      },
      signal: AbortSignal.timeout(3000)
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch permissions" }, { status: res.status })
    }

    const data = await res.json()
    if (data.isSuccess) {
      return NextResponse.json(data.value)
    }
    return NextResponse.json({ error: "Failed to fetch permissions from backend" }, { status: 400 })
  } catch (error: any) {
    console.error("MyPermissions Proxy Route Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
