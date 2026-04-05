import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================
// Configuration
// ============================================

const AUTH_COOKIE_NAME = 'salonos_auth_token';
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const PROTECTED_PATH_PREFIXES = ['/owner', '/staff', '/admin'];
const DEFAULT_LOGIN_REDIRECT = '/login';
const DEFAULT_AUTHENTICATED_REDIRECT = '/owner/dashboard';

// ============================================
// Helper Functions
// ============================================

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

function getTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }
  
  return null;
}

// ============================================
// Middleware
// ============================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromRequest(request);
  const isAuthenticated = !!token;

  // Allow public paths
  if (isPublicPath(pathname)) {
    // If user is already authenticated and tries to access login, redirect to dashboard
    if (isAuthenticated && pathname === '/login') {
      return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_REDIRECT, request.url));
    }
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if (isProtectedPath(pathname)) {
    if (!isAuthenticated) {
      // Store the original URL to redirect back after login
      const loginUrl = new URL(DEFAULT_LOGIN_REDIRECT, request.url);
      // Use dashboard as callback for owner routes
      const callbackPath = pathname.startsWith('/owner') ? '/owner/dashboard' : pathname;
      loginUrl.searchParams.set('callbackUrl', callbackPath);
      return NextResponse.redirect(loginUrl);
    }
    
    // Optional: Add role-based access control here
    // For now, we just check authentication
    return NextResponse.next();
  }

  // For all other paths, allow access
  return NextResponse.next();
}

// ============================================
// Matcher Configuration
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
