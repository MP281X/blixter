import { createClient } from 'redis';

const env = typeof Bun !== 'undefined' ? Bun.env : process.env;
export const redis = createClient({ url: env.REDIS_URL! });
await redis.connect();

process.on('exit', () => {
	redis.disconnect();
	console.log('redis -> disconnect');
});

type ResType<Value extends Record<string, unknown> | undefined, T> = Promise<(Value extends undefined ? T : string) | undefined>;

export const getSet =
	<T extends Record<string, unknown>>(name: string) =>
	async <Value extends T | undefined = undefined>(key: 'uuid' | (string & {}), value?: Value, expire?: number | 'delete'): ResType<Value, T> => {
		if (typeof key !== 'string') return;
		try {
			if (!value) {
				const res = await redis.json.get(`${name}:${key}`);

				if (expire) await redis.expire(`${name}:${key}`, expire === 'delete' ? 1 : expire);

				if (res) return res as any;
			} else {
				const _key = key === 'uuid' ? crypto.randomUUID().toString() : key;
				const res = await redis.json.set(`${name}:${_key}`, '$', value as any);

				if (expire) await redis.expire(`${name}:${_key}`, expire === 'delete' ? 1 : expire);

				if (res) return _key as any;
			}
		} catch (_) {}

		return undefined;
	};
