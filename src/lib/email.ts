import { Resend } from 'resend';

const apiKey = import.meta.env.RESEND_API_KEY;
const fromEmail = import.meta.env.FROM_EMAIL;

function getResend(): Resend {
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  if (!fromEmail) throw new Error('FROM_EMAIL is not set');
  return new Resend(apiKey);
}

export interface SendConfirmationParams {
  to: string;
  firstName: string;
  lastName: string;
  qrImageDataUrl?: string;
}

/** Send RSVP confirmation email. Optionally include QR image as inline base64. */
export async function sendConfirmationEmail(params: SendConfirmationParams): Promise<{ ok: boolean; error?: string }> {
  try {
    const resend = getResend();
    const html = `
      <p>Hi ${params.firstName},</p>
      <p>Your RSVP has been received. We look forward to seeing you!</p>
      ${params.qrImageDataUrl ? `<p><img src="${params.qrImageDataUrl}" alt="QR Code" width="200" height="200" /></p>` : ''}
      <p>— The Team</p>
    `;
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: 'RSVP Confirmation',
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
