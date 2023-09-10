import { redirect, type Handle } from '@sveltejs/kit';
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

		const userData = await userCache(token!);
		if (!userData) unauthorized();

		event.locals.user = userData!;
	}

	// proxy for hls request
	if (event.url.pathname?.startsWith('/hls')) {
		const [id, segment] = event.url.pathname.split('/').slice(2);
		if (id === undefined || segment === undefined) throw redirect(303, '/');

		const url = await downloadUrl('videos', `${id}/${segment}`);
		return fetch(url);
	}

	return await resolve(event);
};
