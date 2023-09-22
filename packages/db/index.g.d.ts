import type { ColumnType } from 'kysely';

export type ConversionStatus = 'converted' | 'converting' | 'failed' | 'uploaded';

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;

export type Resolutions = '1080p' | '360p' | '720p';

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Comments {
	id: Generated<string>;
	user_id: string;
	video_id: string;
	comment: string;
	created_at: Generated<Timestamp>;
}

export interface Subscribers {
	user_id: string;
	channel_id: string;
	created_at: Generated<Timestamp>;
}

export interface Users {
	id: Generated<string>;
	username: string;
	email: string;
	password: string;
	verified: Generated<boolean>;
	created_at: Generated<Timestamp>;
}

export interface Videos {
	id: Generated<string>;
	user_id: string;
	title: string;
	description: string;
	duration: Generated<number>;
	max_res: Generated<Resolutions>;
	status: Generated<ConversionStatus>;
	created_at: Generated<Timestamp>;
}

export interface Views {
	user_id: string;
	video_id: string;
	watch_time: Generated<number>;
	liked: boolean | null;
	created_at: Generated<Timestamp>;
}

export interface DB {
	comments: Comments;
	subscribers: Subscribers;
	users: Users;
	videos: Videos;
	views: Views;
}
