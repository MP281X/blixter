import type { ColumnType } from 'kysely';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

export interface Users {
	id: Generated<string>;
	username: string;
	email: string;
	password: string;
	verified: Generated<boolean>;
}

export interface Videos {
	id: Generated<string>;
	user_id: string;
	name: string;
	description: string;
	converted: Generated<boolean>;
}

export interface DB {
	users: Users;
	videos: Videos;
}
