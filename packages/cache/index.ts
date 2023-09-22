import { getSet, redis } from './src/helpers';

export const userCache = getSet<{ username: string; id: string }>('user');

export const profileCache = getSet<{
	videos: number;
	uploaded: string;
	latest_upload: string;
	views: number;
	comments: number;
	subscribers: number;
	watch_time: string;
	likes: number;
}>('profile');

export { redis };
