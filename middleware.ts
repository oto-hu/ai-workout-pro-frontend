import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        const publicRoutes = [
          '/',
          '/login',
          '/register',
          '/api/auth',
          '/api/generate-workout'
        ]
        
        const { pathname } = req.nextUrl
        
        // Check if the route is public
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
}