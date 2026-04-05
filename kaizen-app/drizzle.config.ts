import type { Config } from 'drizzle-kit';

// Usado pelo drizzle-kit para gerar migrações e inspecionar o schema.
// Fase 2: trocar driver por 'pg' e dialect por 'postgresql' para Supabase.
export default {
  schema:  './db/schema.ts',
  out:     './db/migrations',
  dialect: 'sqlite',
  driver:  'expo',
} satisfies Config;
