import crypto from 'crypto';
import { OpenAI } from 'openai';
import { createClient, type RedisClientType } from 'redis';

const env = typeof Bun !== 'undefined' ? Bun.env : process.env;

let redis: RedisClientType;

if (env.REDIS_URL) {
	redis = createClient({ url: env.REDIS_URL });
	await redis.connect();

	process.on('exit', () => {
		redis.disconnect();
		console.log('redis -> disconnect');
	});
}

let openai: OpenAI;
if (env.OPEN_AI) openai = new OpenAI({ apiKey: env.OPEN_AI! });

export const hashText = (input: string) => {
	input = input.trim().toLowerCase();

	const hash = crypto.createHash('md5');
	hash.update(input);

	return hash.digest('hex');
};

export { redis, openai };
