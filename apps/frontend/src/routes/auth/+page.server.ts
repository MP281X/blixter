import { userCache } from 'cache';
import { fail, redirect } from '@sveltejs/kit';
import { newUser, findUser } from 'db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { newUserSchema: newUser.schema, findUserSchema: findUser.schema };
};

const env = typeof Bun !== 'undefined' ? Bun.env : process.env;

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const { data, errors } = await findUser.query(request.formData(), {});
		if (errors) return fail(400, errors);

		const token = await userCache('uuid', { username: data.username, id: data.id }, 60 * 60 * 24);
		if (!token) return fail(500, { error: 'unable to login' });

		cookies.set('auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24
		});

		throw redirect(303, '/');
	},
	signup: async ({ request, cookies }) => {
		const { data, errors } = await newUser.query(request.formData(), {});
		if (errors) return fail(400, errors);

		const token = await userCache('uuid', { username: data.username, id: data.id }, 60 * 60 * 24);
		if (!token) return fail(500, { error: 'unable to log-in the created user' });

		cookies.set('auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24
		});

		throw redirect(303, '/');
	}
};
