import { test } from 'bun:test';
import { generateEmbedding, searchEmbedding, summarize } from './index.ts';

test('embeddings', async () => {
	const uuid = crypto.randomUUID();
	await generateEmbedding('videos', uuid, 'ciao mondo');

	const res = await searchEmbedding('videos', 'ciao mondo');
	console.log(res);

	process.exit(0);
}, 10000);

test('summarize', async () => {
	const res = await summarize('hi followers, in this video we are talking about cars');
	console.log(res);
	process.exit(0);
}, 10000);
