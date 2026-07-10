import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const sessionCookie = request.cookies.get('session')?.value;
  
  // Admin-only routes
  const isAdminRoute = path.startsWith('/admin') || 
                       (path.startsWith('/api/teams') && request.method !== 'GET') || 
                       path.startsWith('/api/users') ||
                       (path.startsWith('/api/votes') && request.method === 'GET');

  if (isAdminRoute) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    try {
      const payload = await decrypt(sessionCookie);
      if (!payload.isAdmin) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect admin users from public homepage to admin dashboard
  if (path === '/' && sessionCookie) {
    try {
      const payload = await decrypt(sessionCookie);
      if (payload.isAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch (e) {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
