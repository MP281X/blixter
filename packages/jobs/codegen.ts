import fs from 'fs';

const generatedData: string[] = [];

const basePath = '../../apps/jobs-handler/src';
const fileList = fs.readdirSync(`${basePath}/`);
for (const file of fileList) {
	if (fs.statSync(`${basePath}/${file}`).isDirectory()) continue;

	const jobName = file.split('.')[0];
	generatedData.unshift(`import type ${jobName}_type from '${basePath}/${jobName}.js'`);

	generatedData.push(`
    const ${jobName}_queue = new Queue('${jobName}', {
	    connection: {
		    host: redisUrl[0],
		    port: Number(redisUrl[1])
	    }
    });

    export const ${jobName} = async (arg0: Parameters<typeof ${jobName}_type>[number]) => await ${jobName}_queue.add('${jobName}', arg0);
  `);

	console.log(`generated handler for the job '${jobName}`);
}

generatedData.unshift("const redisUrl = (process.env.REDIS_URL ?? '').replace('redis://', '').split(':')");
generatedData.unshift("if (process.env.NODE_ENV !== 'production') await import('dotenv/config');");
generatedData.unshift("import { Queue } from 'bullmq';");

fs.writeFileSync('./index.g.ts', generatedData.join('\n'));
