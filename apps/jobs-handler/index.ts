import * as jobs from './src/index.g.ts';
import { Queue, Worker } from 'bullmq';

const [host, port] = Bun.env.REDIS_URL!.replace('redis://', '').split(':');

for (let [jobName, jobHandler] of Object.entries(jobs)) {
	if (Bun.env.NODE_ENV !== 'production') {
		jobName = `${jobName}_dev`;

		try {
			// clean queue
			await new Queue(jobName, {
				connection: { host, port: Number(port) }
			}).obliterate();
		} catch (_) {}
	}

	// create the worker
	const worker = new Worker(
		jobName,
		async (job) => {
			console.log(job.id);
			await (jobHandler.default as any)(job.data, `${jobName}_${job.id}`);
		},
		{
			connection: {
				host,
				port: Number(port)
			}
		}
	);

	// add listeners
	worker.on('completed', (job, _) => console.log(`[${jobName}_${job.id}] completed`));
	worker.on('failed', (job, error) => console.error(`[${jobName}_${(job ?? { id: 0 }).id}] ${error.message}`));
	worker.on('ready', () => console.log(`loaded '${jobName}'`));
}
