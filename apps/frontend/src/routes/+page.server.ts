import { db, test } from 'db';
import { testQ } from 'jobs';

export const load = async () => {
	await testQ({
		a: 'a',
		b: 1
	});
	const data = await db.select().from(test).limit(1);
	return data[0];
};
