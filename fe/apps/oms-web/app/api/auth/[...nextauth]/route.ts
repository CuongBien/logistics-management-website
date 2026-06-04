import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

let tokenRefreshPromise: Promise<any> | null = null;

async function refreshAccessToken(token: any) {
  if (tokenRefreshPromise) {
    const refreshedTokens = await tokenRefreshPromise;
    if (refreshedTokens.error) {
      return { ...token, error: "RefreshAccessTokenError" };
    }
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  }

  try {
    const url = `${process.env.KEYCLOAK_ISSUER || "http://127.0.0.1:18080/realms/logistics_realm"}/protocol/openid-connect/token`

    tokenRefreshPromise = fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID || "oms-client",
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET || "my-secret",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    }).then(async (response) => {
      const refreshedTokens = await response.json();
      if (!response.ok) {
        throw refreshedTokens;
      }
      return refreshedTokens;
    }).finally(() => {
      tokenRefreshPromise = null;
    });

    const refreshedTokens = await tokenRefreshPromise;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error("Error refreshing access token in OMS", error)
    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "a-very-secure-random-secret-for-development",
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const url = `${process.env.KEYCLOAK_ISSUER || "http://127.0.0.1:18080/realms/logistics_realm"}/protocol/openid-connect/token`
          const response = await fetch(url, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID || "oms-client",
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET || "my-secret",
              grant_type: "password",
              username: credentials.username,
              password: credentials.password,
            }),
          })

          const tokens = await response.json()

          if (!response.ok) {
            throw new Error(tokens.error_description || "Login failed")
          }

          let realSub = credentials.username
          let realName = credentials.username
          let realEmail = `${credentials.username}@shiphub.vn`

          try {
            const base64Url = tokens.access_token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = Buffer.from(base64, 'base64').toString('utf8')
            const decoded = JSON.parse(jsonPayload)
            realSub = decoded.sub || credentials.username
            realName = decoded.name || decoded.preferred_username || credentials.username
            realEmail = decoded.email || `${decoded.preferred_username || credentials.username}@shiphub.vn`
          } catch (decodeErr) {
            console.error("Failed to decode access token in authorize() OMS", decodeErr)
          }

          return {
            id: realSub,
            sub: realSub,
            name: realName,
            email: realEmail,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            id_token: tokens.id_token,
            expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
            provider: "keycloak"
          } as any
        } catch (e) {
          console.error("OMS Auth error:", e)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.accessToken = (user as any).access_token
        token.refreshToken = (user as any).refresh_token
        token.idToken = (user as any).id_token
        token.provider = (user as any).provider
        token.expiresAt = (user as any).expires_at
        
        try {
          const base64Url = (user as any).access_token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8')
          const decoded = JSON.parse(jsonPayload)
          token.sub = decoded.sub
          token.name = decoded.name || decoded.preferred_username || (user as any).name || "User"
          token.email = decoded.email || (user as any).email || `${decoded.preferred_username || "user"}@shiphub.vn`
        } catch(e) {
          token.sub = (user as any).sub || (user as any).id
          token.name = (user as any).name
          token.email = (user as any).email
          console.error("Failed to decode token in jwt callback OMS", e)
        }
        
        return token
      }

      if (Date.now() < (token.expiresAt as number) * 1000 - 60000) {
        return token
      }

      return refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.error = token.error as string
      if (token.sub) {
        session.user = {
          ...session.user,
          id: token.sub,
          name: token.name as string,
          email: token.email as string
        } as any
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: "oms-session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: '/portal/login',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
