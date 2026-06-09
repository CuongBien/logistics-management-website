import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const apiUrl = new URL(`${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Operator/audit-logs`)
    
    // Forward all query parameters
    searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value)
    })

    try {
      const res = await fetch(apiUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`Failed to fetch audit logs:`, errorText)
        return NextResponse.json({ error: "Failed to fetch audit logs from backend", details: errorText }, { status: res.status })
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (apiError: any) {
      console.error(`WMS backend offline during audit logs fetch:`, apiError)
      return NextResponse.json({ error: "WMS backend service unavailable", details: apiError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Get Audit Logs Global Error:', error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
