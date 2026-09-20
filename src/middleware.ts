import { NextResponse, type NextRequest } from 'next/server'

// Fast optimistic gate: requests without a session cookie go to /login.
// Real validation happens server-side in layouts and API routes.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  if (!isAuthPage && !req.cookies.has('pie_session')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|icon.svg|favicon.ico).*)'],
}
