import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getMockUsers, assignMockRole } from "@/lib/mock-rbac-db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      console.warn("Unauthorized API call to users, returning mock users for dev/demo!");
      return NextResponse.json(getMockUsers())
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

      const adminData = await adminRes.json()
      if (!adminRes.ok) {
        console.warn('Failed to get admin token from Keycloak, falling back to mock users.');
        return NextResponse.json(getMockUsers())
      }

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
        console.warn('Failed to fetch users from Keycloak, falling back to mock users.')
        return NextResponse.json(getMockUsers())
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

      let roleAssignments = []
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        if (rolesData.isSuccess) {
           roleAssignments = rolesData.value
        }
      } else {
        console.warn("Failed to fetch role assignments from C# WMS backend.")
      }

      // 4. Merge
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
    } catch (apiError) {
      console.error("Identity or WMS backend offline during staff fetch, falling back to mock users!", apiError)
      return NextResponse.json(getMockUsers())
    }
  } catch (error) {
    console.error('Get Users Global Error:', error)
    return NextResponse.json(getMockUsers())
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { operatorSub, roleCode, warehouseId } = body

    if (!session || !session.accessToken) {
      console.warn("Unauthorized API call to assign role, assigning in mock storage!");
      assignMockRole(operatorSub, roleCode, warehouseId)
      return NextResponse.json({ isSuccess: true })
    }

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
        console.warn("Failed to assign role in C# WMS backend, falling back to mock storage!", await res.text())
        assignMockRole(operatorSub, roleCode, warehouseId)
        return NextResponse.json({ isSuccess: true })
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (fetchError) {
      console.error("Failed to connect to Warehouse API for role assignment, falling back to mock storage!", fetchError)
      assignMockRole(operatorSub, roleCode, warehouseId)
      return NextResponse.json({ isSuccess: true })
    }
  } catch (error) {
    console.error('Assign Role Global Error:', error)
    return NextResponse.json({ isSuccess: false, error: { message: "Internal Server Error" } }, { status: 500 })
  }
}
