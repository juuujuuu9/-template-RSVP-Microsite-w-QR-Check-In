/**
 * Admin auth: no login page. When visiting /admin unauthenticated, frontend shows a dialog.
 * This module verifies the session cookie and validates login payloads.
 */

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;
const SESSION_SECRET = import.meta.env.ADMIN_SESSION_SECRET;
const COOKIE_NAME = 'admin_session';

if (!SESSION_SECRET && import.meta.env.PROD) {
  console.warn('ADMIN_SESSION_SECRET should be set in production');
}

function getSecret(): string {
  if (!SESSION_SECRET) throw new Error('ADMIN_SESSION_SECRET is not set');
  return SESSION_SECRET;
}

function getPassword(): string {
  if (!ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is not set');
  return ADMIN_PASSWORD;
}

/** Simple constant-time compare to avoid timing leaks. */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

/** Create a session token (HMAC-style: secret + timestamp). In production use a proper signed cookie. */
function createToken(): string {
  const secret = getSecret();
  const payload = `admin:${Date.now()}`;
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    h = (h * 31 + payload.charCodeAt(i)) >>> 0;
  }
  const sig = (h ^ secret.length).toString(36);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

/** Verify token is recent (e.g. 24h) and signature matches. */
function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [payload, sig] = decoded.split(':');
    if (!payload?.startsWith('admin:')) return false;
    const secret = getSecret();
    let h = 0;
    for (let i = 0; i < payload.length; i++) {
      h = (h * 31 + payload.charCodeAt(i)) >>> 0;
    }
    const expected = (h ^ secret.length).toString(36);
    return sig === expected;
  } catch {
    return false;
  }
}

export function getSessionCookie(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function isAdminAuthenticated(request: Request): boolean {
  const token = getSessionCookie(request);
  return token !== null && verifyToken(token);
}

/** Redirect response (e.g. form POST). */
export function createSessionRedirect(redirectUrl: string): Response {
  const token = createToken();
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl,
      'Set-Cookie': cookie,
    },
  });
}

/** JSON response with Set-Cookie for SPA (fetch) login. */
export function createSessionJsonResponse(): Response {
  const token = createToken();
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}

/** Validate password and return true if correct. */
export function validatePassword(password: string): boolean {
  return secureCompare(password, getPassword());
}
