import { neon } from '@neondatabase/serverless';

const databaseUrl = import.meta.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = neon(databaseUrl);

export interface EntryRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  terms_accepted: boolean;
  created_at: string;
  hub_entry_id: string | null;
  source_data: Record<string, unknown> | null;
}
