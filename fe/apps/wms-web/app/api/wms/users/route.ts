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
      const usersUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users?max=100`
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

      // 4. Merge Keycloak Users with WMS Role Assignments (only show users who have WMS role assignments, filtering out OMS customer accounts)
      const result = kcUsers
        .filter((u: any) => {
          return roleAssignments.some((r: any) => r.operatorSub === u.id)
        })
        .map((u: any) => {
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
        signal: AbortSignal.timeout(8000)
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
        signal: AbortSignal.timeout(8000)
      })

      let operatorSub: string | undefined;

      if (!createUserRes.ok) {
        if (createUserRes.status === 409) {
          console.log(`User ${username} already exists in Keycloak. Fetching user ID...`)
          const getUserUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users?username=${username}`
          const getUserRes = await fetch(getUserUrl, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
            },
            signal: AbortSignal.timeout(8000)
          })
          if (getUserRes.ok) {
            const usersList = await getUserRes.json()
            const existingUser = usersList.find((u: any) => u.username.toLowerCase() === username.toLowerCase())
            if (existingUser && existingUser.id) {
              operatorSub = existingUser.id
              console.log(`Retrieved existing Keycloak user ID ${operatorSub} for user ${username}`)
            } else {
              return NextResponse.json({ error: "Conflict: User already exists but profile query returned empty details" }, { status: 409 })
            }
          } else {
            return NextResponse.json({ error: "Conflict: User already exists but request to fetch profile failed" }, { status: 409 })
          }
        } else {
          const errText = await createUserRes.text()
          console.error('Failed to create user in Keycloak:', errText)
          return NextResponse.json({ error: "Failed to create user in Keycloak Identity Provider", details: errText }, { status: createUserRes.status })
        }
      } else {
        // Extract operatorSub (UUID of the newly created Keycloak user) from Location header
        const locationHeader = createUserRes.headers.get('Location')
        if (!locationHeader) {
          console.error('Keycloak user created but Location header is missing')
          return NextResponse.json({ error: "Location header missing from Keycloak response" }, { status: 500 })
        }
        
        operatorSub = locationHeader.split('/').pop()
        if (!operatorSub) {
          console.error('Failed to parse operatorSub from Location header:', locationHeader)
          return NextResponse.json({ error: "Failed to parse User ID from Keycloak" }, { status: 500 })
        }
      }

      console.log(`Successfully created/retrieved Keycloak user ${username} with ID ${operatorSub}. Now assigning role ${roleCode} at warehouse ${warehouseId}...`)

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
          signal: AbortSignal.timeout(8000)
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
    const deleteUser = searchParams.get('deleteUser') === 'true'

    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 })
    }

    if (deleteUser) {
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
        console.error('Failed to get admin token from Keycloak during user deletion:', errText)
        return NextResponse.json({ error: "Failed to authenticate with Keycloak", details: errText }, { status: adminRes.status })
      }

      const adminData = await adminRes.json()
      const adminToken = adminData.access_token
      const targetRealm = 'logistics_realm'

      // 2. Delete User in Keycloak
      const deleteUserUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users/${id}`
      const kcDeleteRes = await fetch(deleteUserUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        signal: AbortSignal.timeout(3000)
      })

      if (!kcDeleteRes.ok && kcDeleteRes.status !== 404) {
        const errText = await kcDeleteRes.text()
        console.error('Failed to delete user in Keycloak:', errText)
        return NextResponse.json({ error: "Failed to delete user in Keycloak Identity Provider", details: errText }, { status: kcDeleteRes.status })
      }

      // 3. Clear all WMS role assignments for this user
      const rolesUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment`
      const rolesRes = await fetch(rolesUrl, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        signal: AbortSignal.timeout(3000)
      })

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        if (rolesData.isSuccess) {
          const assignments = rolesData.value || []
          const userAssignments = assignments.filter((r: any) => r.operatorSub === id)
          for (const assignment of userAssignments) {
            await fetch(`${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/${assignment.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${session.accessToken}`
              },
              signal: AbortSignal.timeout(3000)
            })
          }
        }
      }

      return NextResponse.json({ isSuccess: true, message: "User account and all WMS roles deleted successfully" })
    } else {
      // Standard flow: delete single role assignment
      const apiUrl = `${process.env.WAREHOUSE_API_URL || 'http://127.0.0.1:5051'}/api/RoleAssignment/${id}`

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
    }
  } catch (error: any) {
    console.error('Delete User/Role Global Error:', error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { operatorSub, email, firstName, lastName, password } = await req.json()

    if (!operatorSub || !email || !firstName || !lastName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Get Keycloak Admin Token
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
      console.error('Failed to get Keycloak admin token during profile update:', errText)
      return NextResponse.json({ error: "Failed to authenticate with Keycloak", details: errText }, { status: adminRes.status })
    }

    const adminData = await adminRes.json()
    const adminToken = adminData.access_token
    const targetRealm = 'logistics_realm'

    // 2. Update user info in Keycloak
    const updateUserUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users/${operatorSub}`
    const updateRes = await fetch(updateUserUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
      }),
      signal: AbortSignal.timeout(3000)
    })

    if (!updateRes.ok) {
      const errText = await updateRes.text()
      console.error('Failed to update Keycloak user:', errText)
      return NextResponse.json({ error: "Failed to update user profile in Keycloak", details: errText }, { status: updateRes.status })
    }

    // 3. Reset password if provided
    if (password && password.trim().length >= 6) {
      const resetPasswordUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users/${operatorSub}/reset-password`
      const resetRes = await fetch(resetPasswordUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: "password",
          value: password,
          temporary: false
        }),
        signal: AbortSignal.timeout(3000)
      })

      if (!resetRes.ok) {
        const errText = await resetRes.text()
        console.error('Failed to reset user password in Keycloak:', errText)
        return NextResponse.json({ error: "Failed to update user password in Keycloak", details: errText }, { status: resetRes.status })
      }
    }

    return NextResponse.json({ isSuccess: true, message: "User profile updated successfully" })
  } catch (error: any) {
    console.error('Update User Global Error:', error)
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 })
  }
}
