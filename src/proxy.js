import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const rules = {
  '/admin': ['admin'],
  '/manager': ['manager'],
  '/staff': ['staff'],
  '/supplier': ['supplier'],
};

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const prefix = Object.keys(rules).find((p) => pathname.startsWith(p));
  if (!prefix) return NextResponse.next();

  try {
    const token = req.cookies.get('session')?.value;
    const { payload } = await jwtVerify(token, secret);
    if (!rules[prefix].includes(payload.role)) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/manager/:path*', '/staff/:path*', '/supplier/:path*'],
};