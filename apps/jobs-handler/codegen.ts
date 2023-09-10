import fs from 'fs';

const generatedData: string[] = [];

const basePath = './src';
const fileList = fs.readdirSync(`${basePath}/`);
for (const file of fileList) {
	if (fs.statSync(`${basePath}/${file}`).isDirectory()) continue;
	if (file.endsWith('.g.ts') || file.endsWith('.test.ts')) continue;

	generatedData.push(`export * as ${file.split('.')[0]} from "./${file}"`);
}

console.log('generated import/export file');
fs.writeFileSync('./src/index.g.ts', generatedData.join('\n'));
