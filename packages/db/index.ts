import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
export * from './schema.js';

const client = postgres(process.env.POSTGRES_URL!);

export const db = drizzle(client, { schema });
