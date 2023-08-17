import { createClient, type RedisClientType } from 'redis';

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

export const user = getSet<{ username: string }>('user');
