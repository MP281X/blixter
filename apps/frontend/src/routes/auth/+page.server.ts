import { user } from 'cache';

export const load = async () => {
	await user('user1', { username: 'user1' });
	const get = await user('user1');

	return get;
};
