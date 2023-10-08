import fs from 'fs';

const generatedData: string[] = [];

const basePath = '../../apps/jobs-handler/src';
const fileList = fs.readdirSync(`${basePath}/`);
for (const file of fileList) {
	if (fs.statSync(`${basePath}/${file}`).isDirectory()) continue;
	if (file.endsWith('.g.ts') || file.endsWith('.test.ts') || file.endsWith('.d.ts')) continue;

	const jobName = file.split('.')[0];
	const queueName = Bun.env.NODE_ENV !== 'production' ? jobName + '_dev' : jobName;

	generatedData.unshift(`import type ${jobName}_type from '${basePath}/${file}'`);
	generatedData.push(
		`export const ${jobName} = async (arg0: Parameters<typeof ${jobName}_type>[number]) => await redis.LPUSH("jobs:${queueName}", JSON.stringify(arg0));`
	);

	console.log(`generated handler for the job '${jobName}'`);
}

generatedData.unshift(`
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
`);

fs.writeFileSync('./index.g.ts', generatedData.join('\n'));
