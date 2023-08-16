import 'dotenv/config';
import fs from 'fs';
import { Worker } from 'bullmq';

const redisUrl = process.env.REDIS_URL!.replace('redis://', '').split(':');

const currentPath = `${process.argv[1].replace('/index.js', '').replace('/index.ts', '')}/src`;
const fileList = fs.readdirSync(currentPath);
for (const file of fileList) {
	if (fs.statSync(`${currentPath}/${file}`).isDirectory()) continue;
	const jobHandler = (await import(`./src/${file.replace('.ts', '.js')}`)).default as (arg0: Record<string, unknown>) => Promise<void> | void;
	new Worker(file.replace('.ts', '').replace('.js', ''), async (job) => await jobHandler(job.data), {
		connection: {
			host: redisUrl[0],
			port: Number(redisUrl[1])
		}
	});

	console.log(`loaded ${file.replace('.ts', '').replace('.js', '')}`);
}
