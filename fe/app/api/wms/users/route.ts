import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
    })

    const adminData = await adminRes.json()
    if (!adminRes.ok) {
      console.error('Failed to get admin token:', adminData)
      return NextResponse.json({ error: 'Failed to authenticate with Identity Provider' }, { status: 500 })
    }

    const adminToken = adminData.access_token
    const targetRealm = 'logistics_realm'

    // 2. Fetch Users from Keycloak
    const usersUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users`
    const kcRes = await fetch(usersUrl, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    })

    if (!kcRes.ok) {
      const errorText = await kcRes.text()
      console.error('Failed to get users:', errorText)
      return NextResponse.json({ error: 'Failed to fetch users from Identity Provider' }, { status: 500 })
    }

    const kcUsers = await kcRes.json()

    // 3. Fetch Role Assignments from Warehouse API
    const rolesUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment`
    const rolesRes = await fetch(rolesUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`
      }
    })

    let roleAssignments = []
    if (rolesRes.ok) {
      const rolesData = await rolesRes.json()
      if (rolesData.isSuccess) {
         roleAssignments = rolesData.value
      }
    } else {
      console.warn("Failed to fetch role assignments", await rolesRes.text())
    }

    // 4. Merge
    const result = kcUsers.map((u: any) => {
      const userRoles = roleAssignments.filter((r: any) => r.operatorSub === u.id).map((r: any) => ({
        warehouseId: r.warehouseId,
        warehouseName: 'Kho chính', // Default for now
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

  } catch (error) {
    console.error('Get Users Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
