import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Demo users for testing
        const demoUsers: Record<string, any> = {
          'admin@spago.com': {
            id: '1',
            email: 'admin@spago.com',
            name: 'Admin User',
            role: 'ADMIN'
          },
          'kitchen@spago.com': {
            id: '2', 
            email: 'kitchen@spago.com',
            name: 'Kitchen Staff',
            role: 'KITCHEN_STAFF'
          },
          'driver@spago.com': {
            id: '3',
            email: 'driver@spago.com', 
            name: 'Driver User',
            role: 'DELIVERY_DRIVER'
          }
        }

        const user = demoUsers[credentials.email]
        
        if (user && credentials.password === 'password123') {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub
        ;(session.user as any).role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST } 