import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

const databaseUrl = process.env.DATABASE_URL || '';

export const sql = neon(databaseUrl || 'postgresql://placeholder:placeholder@localhost/db');
export const db = drizzle({ client: sql, schema });
export * from '@/db/schema';
