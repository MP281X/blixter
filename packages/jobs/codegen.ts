import fs from 'fs';

const generatedData: string[] = [];

const basePath = '../../apps/jobs-handler/src';
const fileList = fs.readdirSync(`${basePath}/`);
for (const file of fileList) {
	if (fs.statSync(`${basePath}/${file}`).isDirectory()) continue;
	if (file.endsWith('.g.ts') || file.endsWith('.test.ts')) continue;

	const jobName = file.split('.')[0];
	const queueName = Bun.env.NODE_ENV !== 'production' ? jobName + '_dev' : jobName;

	generatedData.unshift(`import type ${jobName}_type from '${basePath}/${file}'`);
	generatedData.push(
		`export const ${jobName} = async (arg0: Parameters<typeof ${jobName}_type>[number]) => await redis.LPUSH("${queueName}", JSON.stringify(arg0));`
	);

	console.log(`generated handler for the job '${jobName}'`);
}

generatedData.unshift(`
import { type RedisClientType, createClient } from 'redis';

let redis: RedisClientType;

if (process.env.REDIS_URL) {
	redis = createClient({ url: process.env.REDIS_URL! });
	await redis.connect();

	process.on('exit', async () => await redis.disconnect());
}
`);

fs.writeFileSync('./index.g.ts', generatedData.join('\n'));
