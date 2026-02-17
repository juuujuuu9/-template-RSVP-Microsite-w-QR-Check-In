import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '@/lib/auth';
import { sql } from '@/lib/db';
import type { EntryRow } from '@/lib/db';

export const GET: APIRoute = async ({ request }): Promise<Response> => {
  if (!isAdminAuthenticated(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const rows = await sql`
      SELECT id, first_name, last_name, email, terms_accepted, created_at, hub_entry_id, source_data
      FROM entries
      ORDER BY created_at DESC
    `;
    const entries = rows as EntryRow[];
    return new Response(JSON.stringify({ entries }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Entries fetch error', e);
    return new Response(JSON.stringify({ error: 'Failed to load entries' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
