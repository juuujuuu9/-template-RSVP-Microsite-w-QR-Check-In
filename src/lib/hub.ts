/**
 * Hub (QR-Check-In) webhook integration.
 * Call server-side only; never expose HUB_WEBHOOK_KEY to the client.
 */

export interface HubWebhookPayload {
  eventSlug: string;
  email: string;
  name?: string;
  micrositeEntryId?: string;
  sourceData?: Record<string, unknown>;
  generateQR?: boolean;
  sendEmail?: boolean;
}

export interface HubWebhookSuccess {
  entryId: string;
  qrPayload?: string;
  qrUrl?: string;
  existing?: boolean;
  refreshed?: boolean;
}

const HUB_URL = import.meta.env.HUB_URL;
const HUB_WEBHOOK_KEY = import.meta.env.HUB_WEBHOOK_KEY;
const HUB_EVENT_SLUG = import.meta.env.HUB_EVENT_SLUG;

export function isHubConfigured(): boolean {
  return Boolean(HUB_URL && HUB_WEBHOOK_KEY && HUB_EVENT_SLUG);
}

/** POST to hub webhook; returns response or error. Use exact qrPayload for QR encoding. */
export async function pushToHub(payload: HubWebhookPayload): Promise<{ ok: true; data: HubWebhookSuccess } | { ok: false; status?: number; error: string }> {
  if (!HUB_URL || !HUB_WEBHOOK_KEY) {
    return { ok: false, error: 'Hub not configured (HUB_URL or HUB_WEBHOOK_KEY missing)' };
  }
  const eventSlug = payload.eventSlug ?? HUB_EVENT_SLUG;
  if (!eventSlug || !payload.email) {
    return { ok: false, error: 'eventSlug and email are required' };
  }

  const body = {
    eventSlug,
    email: payload.email,
    name: payload.name,
    micrositeEntryId: payload.micrositeEntryId,
    sourceData: payload.sourceData,
    generateQR: payload.generateQR ?? true,
    sendEmail: payload.sendEmail ?? false,
  };

  const res = await fetch(`${HUB_URL.replace(/\/$/, '')}/api/webhooks/entry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${HUB_WEBHOOK_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, error: text || res.statusText };
  }

  const data = (await res.json()) as HubWebhookSuccess;
  return { ok: true, data };
}
