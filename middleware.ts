import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  
  // Allow access to public routes
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/api/auth',
    '/api/generate-workout'
  ]
  
  // Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Require authentication for protected routes
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
}
