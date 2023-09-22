import { redirect, type Handle, error } from '@sveltejs/kit';
import { userCache } from 'cache';
import { downloadUrl } from 's3';

export const handle: Handle = async ({ event, resolve }) => {
	const unauthorized = () => {
		event.cookies.delete('auth_token');
		throw redirect(303, 'auth');
	};

	if (event.route.id !== '/auth') {
		const token = event.cookies.get('auth_token');

		if (!token) unauthorized();

		const userData = await userCache(token!, undefined, 60 * 60 * 24);
		if (!userData) unauthorized();

		event.locals.user = userData!;
	}

	// proxy for hls request
	if (event.url.pathname?.startsWith('/s3')) {
		const [type, id, segment] = event.url.pathname.split('/').slice(2);
		if (!type || !id) throw error(404);

		if (type === 'videos' && segment) {
			const url = await downloadUrl('videos', `${id}/${segment}`);
			return fetch(url);
		} else if (type === 'images') {
			const url = await downloadUrl('images', id);
			return fetch(url);
		}

		throw error(404);
	}

	return await resolve(event);
};
