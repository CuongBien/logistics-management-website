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
          id: r.id,
          warehouseId: r.warehouseId,
          warehouseName: r.warehouseName || r.warehouseId.split('-')[0],
          roleName: r.roleName,
          roleCode: r.roleCode
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
    const isCreateNewStaff = body.username && body.password

    if (isCreateNewStaff) {
      const { username, password, email, firstName, lastName, roleCode, warehouseId } = body

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
        console.error('Failed to get admin token from Keycloak during staff creation:', errText)
        return NextResponse.json({ error: "Failed to authenticate with Keycloak for user creation", details: errText }, { status: adminRes.status })
      }

      const adminData = await adminRes.json()
      const adminToken = adminData.access_token
      const targetRealm = 'logistics_realm'

      // 2. Create User in Keycloak
      const createUserUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users`
      const createUserRes = await fetch(createUserUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          firstName,
          lastName,
          enabled: true,
          credentials: [
            {
              type: "password",
              value: password,
              temporary: false
            }
          ]
        }),
        signal: AbortSignal.timeout(3000)
      })

      if (!createUserRes.ok) {
        const errText = await createUserRes.text()
        console.error('Failed to create user in Keycloak:', errText)
        return NextResponse.json({ error: "Failed to create user in Keycloak Identity Provider", details: errText }, { status: createUserRes.status })
      }

      // Extract operatorSub (UUID of the newly created Keycloak user) from Location header
      const locationHeader = createUserRes.headers.get('Location')
      if (!locationHeader) {
        console.error('Keycloak user created but Location header is missing')
        return NextResponse.json({ error: "Location header missing from Keycloak response" }, { status: 500 })
      }
      
      const operatorSub = locationHeader.split('/').pop()
      if (!operatorSub) {
        console.error('Failed to parse operatorSub from Location header:', locationHeader)
        return NextResponse.json({ error: "Failed to parse User ID from Keycloak" }, { status: 500 })
      }

      console.log(`Successfully created Keycloak user ${username} with ID ${operatorSub}. Now assigning role ${roleCode} at warehouse ${warehouseId}...`)

      // 3. Assign role in C# WMS Backend
      const assignRoleUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment`
      
      try {
        const res = await fetch(assignRoleUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operatorSub,
            roleCode,
            warehouseId,
            displayName: `${lastName} ${firstName}`.trim()
          }),
          signal: AbortSignal.timeout(3000)
        })

        if (!res.ok) {
          const errorText = await res.text()
          console.error(`Failed to assign role to new user ${username} (${operatorSub}) in C# backend:`, errorText)
          return NextResponse.json({ 
            error: "User created in Keycloak, but WMS role assignment failed", 
            details: errorText,
            operatorSub
          }, { status: res.status })
        }

        const data = await res.json()
        return NextResponse.json({
          isSuccess: true,
          message: "Staff created and role assigned successfully",
          operatorSub,
          data
        })
      } catch (fetchError: any) {
        console.error(`Failed to connect to C# backend to assign role for new user ${username}:`, fetchError)
        return NextResponse.json({ 
          error: "User created in Keycloak, but failed to connect to WMS backend for role assignment", 
          details: fetchError.message,
          operatorSub
        }, { status: 500 })
      }

    } else {
      // Existing flow: Assign role to already created staff
      const { operatorSub, roleCode, warehouseId, displayName } = body
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
            warehouseId,
            displayName
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
    }
  } catch (error: any) {
    console.error('Assign Role Global Error:', error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Missing assignment ID parameter" }, { status: 400 })
    }

    const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/${id}`

    try {
      const res = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        signal: AbortSignal.timeout(3000)
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`Failed to delete role assignment ${id} in C# backend:`, errorText)
        return NextResponse.json({ error: "Failed to delete role assignment in WMS backend", details: errorText }, { status: res.status })
      }

      const data = await res.json()
      return NextResponse.json(data)
    } catch (fetchError: any) {
      console.error(`Failed to connect to WMS backend for deleting role assignment ${id}:`, fetchError)
      return NextResponse.json({ error: "WMS backend connection failed during deletion", details: fetchError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Delete Role Global Error:', error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
