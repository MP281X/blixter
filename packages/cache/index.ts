import { createClient, type RedisClientType } from 'redis';
if (process.env.NODE_ENV !== 'production') await import('dotenv/config');

let redis: RedisClientType;

if (process.env.REDIS_URL) {
	redis = createClient({
		url: process.env.REDIS_URL
	});

	await redis.connect();
}

const getSet =
	<T extends Record<string, unknown>>(name: string) =>
	async (key: string, value?: T) => {
		if (typeof key !== 'string') return;
		try {
			if (!value) {
				const res = await redis.json.get(`${name}:${key}`);

				if (res) return res as any as T;
			} else {
				const res = await redis.json.set(`${name}:${key}`, '$', value as any);
				if (res) return value;
			}
		} catch (_) {}
	};

export const userCache = getSet<{ username: string }>('user');
