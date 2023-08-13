import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const test = pgTable('test', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 256 })
});

const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);
