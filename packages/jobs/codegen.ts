import { JobsOptions } from 'bullmq';
import fs from 'fs';

const generatedData: string[] = [];

const basePath = '../../apps/jobs-handler/src';
const fileList = fs.readdirSync(`${basePath}/`);
for (const file of fileList) {
	if (fs.statSync(`${basePath}/${file}`).isDirectory()) continue;
	if (file.endsWith('.g.ts') || file.endsWith('.test.ts')) continue;

	const jobName = file.split('.')[0];

	generatedData.unshift(`import type ${jobName}_type from '${basePath}/${file}'`);

	const options: JobsOptions =
		process.env.NODE_ENV !== 'production'
			? {
					removeOnFail: true,
					removeOnComplete: true,
					removeDependencyOnFailure: true
			  }
			: {};

	generatedData.push(`
    const ${jobName}_queue = new Queue('${process.env.NODE_ENV !== 'production' ? jobName + '_dev' : jobName}', {
	    connection: {
		    host: redisUrl[0],
		    port: Number(redisUrl[1]),
        enableOfflineQueue: false,
	    }
    });

    export const ${jobName} = async (arg0: Parameters<typeof ${jobName}_type>[number]) => await ${jobName}_queue.add('${jobName}', arg0, ${JSON.stringify(
			options
		)});
  `);

	console.log(`generated handler for the job '${jobName}'`);
}

generatedData.unshift("const redisUrl = (process.env.REDIS_URL ?? '').replace('redis://', '').split(':')");
generatedData.unshift("import { Queue } from 'bullmq';");

fs.writeFileSync('./index.g.ts', generatedData.join('\n'));
