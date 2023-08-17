import type { PageServerLoad } from './$types';
import { userCache } from 'cache';

export const load: PageServerLoad = async () => {
	await userCache('user1', { username: 'user1' });
	const get = await userCache('user1');

	return get;
};
