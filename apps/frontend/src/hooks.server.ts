import type { Handle } from '@sveltejs/kit';
import 'dotenv/config';

export const handle: Handle = async ({ event, resolve }) => {
	return await resolve(event);
};
