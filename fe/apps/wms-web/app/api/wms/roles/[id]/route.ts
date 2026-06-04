import { NextResponse } from 'next/server'
import { getSession } from "@/lib/auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    console.log('[DELETE Role] Session exists:', !!session, 'Has token:', !!session?.accessToken)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    console.log('[DELETE Role] Role ID:', id)
    
    if (!id) {
      return NextResponse.json({ error: "Missing Role ID parameter" }, { status: 400 })
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/Roles/${id}`
    console.log('[DELETE Role] Calling C# backend:', apiUrl)
    
    const res = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    console.log('[DELETE Role] C# backend response status:', res.status, res.statusText)

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[DELETE Role] Failed. Status: ${res.status}. Body:`, errText)
      return NextResponse.json({ error: "Failed to delete role", details: errText }, { status: res.status })
    }

    const responseText = await res.text()
    console.log('[DELETE Role] Success. Body:', responseText.substring(0, 200))
    const data = responseText ? JSON.parse(responseText) : { isSuccess: true }
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[DELETE Role] Exception:", error?.message, error?.stack)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
