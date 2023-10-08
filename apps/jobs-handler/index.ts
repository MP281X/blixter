import { rejects } from 'assert';
import * as jobs from './src/index.g.ts';
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
		const raw_data = await redis_queue.BRPOPLPUSH(`jobs:${jobName}`, `jobs:${jobName}_temp`, 0);
		if (!raw_data) continue;

		try {
			const data = JSON.parse(raw_data);
			await new Promise((resolve, reject) => {
				const timeoutId = setTimeout(
					() => {
						clearTimeout(timeoutId);
						reject(new Error(`${jobName} -> timeut`));
					},
					30 * 60 * 1000
				);

				jobHandler
					.default(data)
					.then(() => {
						clearTimeout(timeoutId);
						resolve(undefined);
					})
					.catch(e => {
						clearTimeout(timeoutId);
						rejects(e);
					});
			});
		} catch (e) {
			console.error(`${jobName} -> ${e}`);
			continue;
		}

		await redis.LREM(`${jobName}_temp`, 1, raw_data);
	}
});
