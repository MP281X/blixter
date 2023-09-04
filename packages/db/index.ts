// @ts-expect-error
import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from './index.g.d.ts';
import { z } from 'zod';

export const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new pg.Pool({
			connectionString: process.env.POSTGRES_URL
		})
	})
});

export const newUserSchema = z
	.object({
		username: z.string().min(5).max(20).toLowerCase().trim(),
		email: z.string().max(50).email().toLowerCase().trim(),
		password: z.string().min(5).max(30),
		verified: z.boolean().default(false)
	})
	.pick({ username: true, email: true, password: true });

export const findUserSchema = z
	.object({
		username: z.string().min(5).max(20).toLowerCase().trim(),
		password: z.string().min(5).max(30)
	})
	.pick({ username: true, password: true });
