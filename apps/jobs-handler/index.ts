import * as jobs from './src/index.g.ts';
import { Worker } from 'bullmq';

const redisUrl = process.env.REDIS_URL!.replace('redis://', '').split(':');

for (let [jobName, jobHandler] of Object.entries(jobs)) {
	if (process.env.NODE_ENV !== 'production') jobName = `${jobName}_dev`;

	new Worker(jobName, async (job) => await (jobHandler as any)(job.data), {
		connection: {
			host: redisUrl[0],
			port: Number(redisUrl[1])
		}
	});

	console.log(`loaded '${jobName}'`);
}
