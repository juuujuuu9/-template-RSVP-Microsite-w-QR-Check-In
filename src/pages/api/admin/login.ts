import type { APIRoute } from 'astro';
import { validatePassword, createSessionJsonResponse } from '@/lib/auth';

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) {
    return new Response(JSON.stringify({ error: 'Password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!validatePassword(password)) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return createSessionJsonResponse();
};
