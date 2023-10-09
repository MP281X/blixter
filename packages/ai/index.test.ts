import { test } from 'bun:test';
import { summarize } from './index.ts';

test('summarize', async () => {
	const res = await summarize('hi followers, in this video we are talking about cars');
	console.log(res);
	process.exit(0);
}, 10000);
