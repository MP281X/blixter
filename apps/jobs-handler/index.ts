import * as jobs from './src/index.g.ts';
export * as jobs from './src/index.g.ts';
import { createClient } from 'redis';

const redis = createClient({ url: Bun.env.REDIS_URL! });
await redis.connect();
process.on('exit', async () => await redis.disconnect());

Object.entries(jobs).forEach(async ([jobName, jobHandler]) => {
	// duplicate the redis client to avoid that one job block the other
	const redis_queue = redis.duplicate();
	await redis_queue.connect();

	if (Bun.env.NODE_ENV !== 'production') jobName = `${jobName}_dev`;
	console.log(`loaded '${jobName}'`);

	while (true) {
		const raw_data = await redis_queue.BRPOPLPUSH(jobName, `${jobName}_temp`, 0);
		if (!raw_data) continue;

		try {
			const data = JSON.parse(raw_data);
			await jobHandler.default(data);
		} catch (e) {
			console.error(`${jobName} -> ${e}`);
			continue;
		}

		await redis.LREM(`${jobName}_temp`, 1, raw_data);
	}
});
