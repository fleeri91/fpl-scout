import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

// Single-user app: there's no signup and no database. The one allowed
// account is an email plus a bcrypt hash, both supplied via env vars —
// AUTH_PASSWORD_HASH holds a hash (e.g. from `npx bcryptjs`), never the
// plaintext password. Sessions are JWT-based throughout (required for
// Credentials, and avoids needing a DB adapter for Google too).
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email
        const password = credentials?.password
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null
        }

        const allowedEmail = process.env.AUTH_EMAIL
        const passwordHash = process.env.AUTH_PASSWORD_HASH
        if (!allowedEmail || !passwordHash) return null
        if (email.trim().toLowerCase() !== allowedEmail.trim().toLowerCase()) {
          return null
        }

        const valid = await bcrypt.compare(password, passwordHash)
        if (!valid) return null

        return { id: allowedEmail, email: allowedEmail }
      },
    }),
  ],
})
