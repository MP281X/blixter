import { text, pgTable, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

type Schema = {
	add?: z.ZodObject<any>;
	select?: z.ZodObject<any>;
};

// users
export const users = pgTable('user', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: varchar('username', { length: 20 }).notNull(),
	email: varchar('email', { length: 30 }).notNull(),
	password: text('password').notNull(),
	verified: boolean('boolean').default(false).notNull()
});

export const usersSchema = {
	add: createInsertSchema(users, {
		username: z.string().min(5).max(20).toLowerCase().trim(),
		email: z.string().email().toLowerCase().trim(),
		password: z.string().min(5),
		verified: z.literal(true).optional()
	})
} satisfies Schema;

// video
export const video = pgTable('video', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 20 }).notNull(),
	description: text('description').notNull(),
	url: text('url').notNull(),
	converted: boolean('converted').notNull().default(false)
});

export const videoSchema = {
	add: createInsertSchema(video, {
		name: z.string().min(5).max(20),
		description: z.string().length(500),
		url: z.string().url()
	})
} satisfies Schema;
