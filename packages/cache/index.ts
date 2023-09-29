import { getSet, redis } from './src/helpers';

export const userCache = getSet<{ username: string; id: string }>('user');

export const profileCache = getSet<{
	videos: number;
	latest_upload: string;
	uploaded: string;
	views: string;
	comments: number;
	subscribers: string;
	watch_time: string;
	likes: number;
}>('profile');

export const videoCache = getSet<{
	subscribers: number;
	username: string;
	id: string;
	user_id: string;
	created_at: Date;
	title: string;
	description: string;
	duration: number;
	views: number;
}>('video');

export { redis };
