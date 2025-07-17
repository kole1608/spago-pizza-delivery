import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public routes
        if (pathname.startsWith('/auth') || pathname === '/') {
          return true
        }
        
        // Require authentication for protected routes
        if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
          return false
        }
        if (pathname.startsWith('/kitchen') && token?.role !== 'KITCHEN_STAFF') {
          return false
        }
        if (pathname.startsWith('/driver') && token?.role !== 'DELIVERY_DRIVER') {
          return false
        }
        
        return !!token
      }
    }
  }
)

export const config = {
  matcher: ['/admin/:path*', '/kitchen/:path*', '/driver/:path*', '/dashboard/:path*']
} 
