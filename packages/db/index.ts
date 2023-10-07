// @ts-expect-error
import pg from 'pg';
import { Kysely, PostgresDialect, sql } from 'kysely';
import type { DB } from './index.g.d.ts';
import { hashPassword, validator } from './src/helpers';
import { z } from 'zod';

// db instance
const env = typeof Bun !== 'undefined' ? Bun.env : process.env;
export const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new pg.Pool({
			connectionString: env.POSTGRES_URL
		})
	})
});

export { sql };

process.on('exit', () => {
	db.destroy();
	console.log('db -> disconnect');
});

// user
export const newUser = validator('users', 'required', {
	username: z.string().toLowerCase().trim().min(3).max(20),
	email: z.string().toLowerCase().trim().max(50).email(),
	password: z.string().trim().min(5).max(30).transform(hashPassword)
});

export const findUser = validator('users', 'optional', {
	username: z.string().toLowerCase().trim().min(3).max(20),
	password: z.string().trim().min(5).max(30).transform(hashPassword)
});

// video
export const newVideo = validator('videos', 'optional', {
	_id: z.string().uuid().nonempty({ message: 'video not found' }),
	_format: z.enum(['mp4'], { invalid_type_error: 'video not found' })
});

// comment
export const newComment = validator('comments', 'optional', {
	comment: z.string().max(50)
});
