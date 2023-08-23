import { text, pgTable, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// users
export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: varchar('username', { length: 20 }).notNull().unique(),
	email: varchar('email', { length: 50 }).notNull().unique(),
	password: text('password').notNull(),
	verified: boolean('boolean').default(false).notNull()
});

export const newUserSchema = createInsertSchema(users, {
	username: z.string().min(5).max(20).toLowerCase().trim(),
	email: z.string().max(50).email().toLowerCase().trim(),
	password: z.string().min(5).max(30),
	verified: z.boolean().default(false)
}).pick({ username: true, email: true, password: true });

export const findUserSchema = createSelectSchema(users, {
	username: z.string().min(5).max(20).toLowerCase().trim(),
	password: z.string().min(5).max(30)
}).pick({ username: true, password: true });

// video
export const videos = pgTable('videos', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 20 }).notNull(),
	description: text('description').notNull()
});
