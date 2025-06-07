import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  // Firebase Auth handles authentication client-side
  // This middleware can be used for other purposes like headers, redirects, etc.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ]
}
