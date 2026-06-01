import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      // 1. Get Admin Token for Keycloak
      const adminUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/realms/master/protocol/openid-connect/token`
      const adminRes = await fetch(adminUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: 'admin-cli',
          username: process.env.KEYCLOAK_ADMIN || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
          grant_type: 'password',
        }),
        signal: AbortSignal.timeout(3000)
      })

      if (!adminRes.ok) {
        const errText = await adminRes.text()
        console.error('Failed to get admin token from Keycloak:', errText)
        return NextResponse.json({ error: "Failed to authenticate with Keycloak", details: errText }, { status: adminRes.status })
      }

      const adminData = await adminRes.json()
      const adminToken = adminData.access_token
      const targetRealm = 'logistics_realm'

      // 2. Fetch Users from Keycloak
      const usersUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users`
      const kcRes = await fetch(usersUrl, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        signal: AbortSignal.timeout(3000)
      })

      if (!kcRes.ok) {
        const errText = await kcRes.text()
        console.error('Failed to fetch users from Keycloak:', errText)
        return NextResponse.json({ error: "Failed to fetch users from Keycloak", details: errText }, { status: kcRes.status })
      }

      const kcUsers = await kcRes.json()

      // 3. Fetch Role Assignments from Warehouse API
      const rolesUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment`
      const rolesRes = await fetch(rolesUrl, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        signal: AbortSignal.timeout(3000)
      })

      if (!rolesRes.ok) {
        const errText = await rolesRes.text()
        console.error("Failed to fetch role assignments from C# WMS backend:", errText)
        return NextResponse.json({ error: "Failed to fetch role assignments from WMS backend", details: errText }, { status: rolesRes.status })
      }

      const rolesData = await rolesRes.json()
      let roleAssignments = []
      if (rolesData.isSuccess) {
        roleAssignments = rolesData.value || []
      } else {
        console.error("WMS backend returned unsuccessful status for role assignments:", rolesData)
        return NextResponse.json({ error: "WMS backend operation failed", details: rolesData.error?.message || "Unknown error" }, { status: 400 })
      }

      // 4. Merge Keycloak Users with WMS Role Assignments
      const result = kcUsers.map((u: any) => {
        const userRoles = roleAssignments.filter((r: any) => r.operatorSub === u.id).map((r: any) => ({
          warehouseId: r.warehouseId,
          warehouseName: r.warehouseName || 'Kho chính',
          roleName: r.roleName
        }))

        return {
          operatorSub: u.id,
          fullName: `${u.lastName || ''} ${u.firstName || ''}`.trim() || u.username,
          email: u.email || `${u.username}@example.com`,
          username: u.username,
          roles: userRoles
        }
      })

      return NextResponse.json(result)
    } catch (apiError: any) {
      console.error("Identity or WMS backend offline during staff fetch:", apiError)
      return NextResponse.json({ error: "Backend services unavailable", details: apiError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Get Users Global Error:', error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { operatorSub, roleCode, warehouseId } = body
    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment`
    
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operatorSub,
          roleCode,
          warehouseId
        }),
        signal: AbortSignal.timeout(3000)
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error("Failed to assign role in C# WMS backend:", errorText)
        return NextResponse.json({ error: "Failed to assign role in WMS backend", details: errorText }, { status: res.status })
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error("Failed to connect to Warehouse API for role assignment:", fetchError)
      return NextResponse.json({ error: "WMS backend connection failed", details: fetchError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Assign Role Global Error:', error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
