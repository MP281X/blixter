import 'dotenv/config';
import fs from 'fs';
import { Worker } from 'bullmq';

const redisUrl = process.env.REDIS_URL!.replace('redis://', '').split(':');
const fileList = fs.readdirSync('./src');
for (const file of fileList) {
	if (fs.statSync(`./src/${file}`).isDirectory()) continue;

	const jobHandler = (await import(`./src/${file.replace('.ts', '.js')}`)).default as (arg0: Record<string, unknown>) => Promise<void> | void;
	new Worker(file.replace('.ts', ''), async (job) => await jobHandler(job.data), {
		connection: {
			host: redisUrl[0],
			port: Number(redisUrl[1])
		}
	});

	console.log(`loaded ${file.replace('.ts', '')}`);
}
