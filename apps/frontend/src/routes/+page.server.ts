import { db, test } from 'db';

export const load = async () => {
	const data = await db.select().from(test).limit(1);
	return data[0];
};
