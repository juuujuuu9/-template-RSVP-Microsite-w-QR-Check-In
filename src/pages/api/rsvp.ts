import type { APIRoute } from 'astro';
import { sql } from '@/lib/db';
import { sendConfirmationEmail } from '@/lib/email';
import { pushToHub, isHubConfigured } from '@/lib/hub';
import QRCode from 'qrcode';

const HUB_EVENT_SLUG = import.meta.env.HUB_EVENT_SLUG;

export const POST: APIRoute = async ({ request }): Promise<Response> => {
  if (request.headers.get('Content-Type')?.includes('application/json') !== true) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { firstName?: string; lastName?: string; email?: string; terms?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const terms = body.terms === true;

  if (!firstName || !lastName || !email) {
    return new Response(
      JSON.stringify({ error: 'First name, last name, and email are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!terms) {
    return new Response(
      JSON.stringify({ error: 'You must accept the terms' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email address' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let entryId: string;
  let hubEntryId: string | null = null;
  let qrPayload: string | undefined;

  try {
    const rows = await sql`
      INSERT INTO entries (first_name, last_name, email, terms_accepted)
      VALUES (${firstName}, ${lastName}, ${email}, ${terms})
      RETURNING id
    `;
    const row = rows[0] as { id: string } | undefined;
    if (!row) throw new Error('Insert failed');
    entryId = row.id;
  } catch (e) {
    console.error('DB insert error', e);
    return new Response(
      JSON.stringify({ error: 'Could not save your response. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (isHubConfigured() && HUB_EVENT_SLUG) {
    const hubResult = await pushToHub({
      eventSlug: HUB_EVENT_SLUG,
      email,
      name: `${firstName} ${lastName}`.trim(),
      micrositeEntryId: entryId,
      sourceData: { firstName, lastName, terms_accepted: terms },
      generateQR: true,
      sendEmail: false,
    });
    if (hubResult.ok) {
      hubEntryId = hubResult.data.entryId;
      qrPayload = hubResult.data.qrPayload;
      try {
        await sql`UPDATE entries SET hub_entry_id = ${hubEntryId}, source_data = ${JSON.stringify({ hubEntryId, qrUrl: hubResult.data.qrUrl })} WHERE id = ${entryId}`;
      } catch {
        // non-fatal
      }
    }
  }

  let qrImageDataUrl: string | undefined;
  if (qrPayload) {
    try {
      qrImageDataUrl = await QRCode.toDataURL(qrPayload, { width: 200, margin: 2 });
    } catch {
      // optional
    }
  }

  const emailResult = await sendConfirmationEmail({
    to: email,
    firstName,
    lastName,
    qrImageDataUrl,
  });
  if (!emailResult.ok) {
    console.error('Resend error', emailResult.error);
    // Still return 201; entry was saved
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Thank you! Your RSVP has been received.',
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
