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
    const operatorSub = searchParams.get('operatorSub')

    if (!operatorSub) {
      return NextResponse.json({ error: "Missing operatorSub parameter" }, { status: 400 })
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Operator/${operatorSub}/Performance`

    try {
      const res = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        signal: AbortSignal.timeout(5000)
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`Failed to fetch performance for ${operatorSub}:`, errorText)
        return NextResponse.json({ error: "Failed to fetch operator performance from backend", details: errorText }, { status: res.status })
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (apiError: any) {
      console.error(`WMS backend offline during operator performance fetch for ${operatorSub}:`, apiError)
      return NextResponse.json({ error: "WMS backend service unavailable", details: apiError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Get Operator Performance Global Error:', error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
