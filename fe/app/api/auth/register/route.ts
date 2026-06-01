import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password, email, firstName, lastName, tenantId } = body

    if (!username || !password || !email) {
      return NextResponse.json({ error: 'Username, password, and email are required' }, { status: 400 })
    }

    // 1. Get Admin Token
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
      return NextResponse.json({ error: 'Internal Server Error (Admin Auth)' }, { status: 500 })
    }

    const adminToken = adminData.access_token
    const targetRealm = 'logistics_realm'
    const usersUrl = `${process.env.KEYCLOAK_URL || 'http://127.0.0.1:18080'}/admin/realms/${targetRealm}/users`

    // 2. Create User
    const userPayload: any = {
      username,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      enabled: true,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        }
      ],
      attributes: {}
    }

    if (tenantId) {
      userPayload.attributes.tenant = [tenantId]
    } else {
      // Default tenant if none provided
      userPayload.attributes.tenant = ['default-tenant']
    }

    const createUserRes = await fetch(usersUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(userPayload)
    })

    if (!createUserRes.ok) {
      const errorText = await createUserRes.text()
      console.error('Failed to create user:', errorText)
      // Usually 409 Conflict if user exists
      if (createUserRes.status === 409) {
         return NextResponse.json({ error: 'Tên đăng nhập hoặc email đã tồn tại' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create user in identity provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Đăng ký thành công' }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
