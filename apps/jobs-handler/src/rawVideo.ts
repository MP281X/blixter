import { fetch } from 'undici';
import fs from 'fs';
import type { ReadableStream } from 'stream/web';

type Input = {
	id: string;
	format: 'mp4';
};

const cacheFile = async (format: Input['format'], id: string, body: ReadableStream<any>) => {
	const basePath = `${process.argv[1].replace('/index.js', '').replace('/index.ts', '')}/cache/${id}/raw.${format}`;

	return new Promise((resolve, reject) => {
		const destination = fs.createWriteStream(`${basePath}/${fileName}`);
		const pipe = body.pipeThrough(destination);

		pipe.on('finish', () => resolve(`${basePath}/${fileName}`));
		pipe.on('error', (e: any) => {
			console.error(e);
			reject();
		});
	});
};
export default async ({ id, format }: Input) => {
	const res = await fetch('', {});

	const destination = fs.createWriteStream('ok');
	res.arrayBuffer();
	console.log(id, format);
};
