import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '@/lib/auth';

export const GET: APIRoute = async ({ request }): Promise<Response> => {
  const ok = isAdminAuthenticated(request);
  return new Response(JSON.stringify({ authenticated: ok }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
