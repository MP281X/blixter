import fs from 'fs';

const generatedData: string[] = [];

const basePath = './src/';
const fileList = fs.readdirSync(`${basePath}/`);
for (const file of fileList) {
	if (fs.statSync(`${basePath}/${file}`).isDirectory()) continue;
	if (file === 'index.g.ts') continue;

	const jobName = file.split('.')[0];
	generatedData.push(`export * as ${jobName} from "./${jobName}.ts"`);
}

console.log('generated import/export file');
fs.writeFileSync('./src/index.g.ts', generatedData.join('\n'));
