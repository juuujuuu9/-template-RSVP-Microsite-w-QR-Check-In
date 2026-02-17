import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '@/lib/auth';
import { sql } from '@/lib/db';

export const GET: APIRoute = async ({ request }): Promise<Response> => {
  if (!isAdminAuthenticated(request)) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    const rows = await sql`
      SELECT first_name, last_name, email, created_at
      FROM entries
      ORDER BY created_at DESC
    `;
    const headers = ['first_name', 'last_name', 'email', 'created_at'];
    const csvLines = [headers.join(',')];
    for (const row of rows as Record<string, unknown>[]) {
      const values = headers.map((h) => {
        const v = row[h];
        if (v == null) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      });
      csvLines.push(values.join(','));
    }
    const csv = csvLines.join('\n');
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="entries.csv"',
      },
    });
  } catch (e) {
    console.error('CSV export error', e);
    return new Response('Export failed', { status: 500 });
  }
};
