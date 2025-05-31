import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Allow access to public routes
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/api/generate-workout'
  ]
  
  // Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // For protected routes, we'll rely on Firebase Auth to handle redirects
  // on the client side since Firebase Auth state is handled client-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ]
}