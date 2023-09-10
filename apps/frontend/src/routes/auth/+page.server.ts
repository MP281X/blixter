import { userCache } from 'cache';
import { fail, redirect } from '@sveltejs/kit';
import { newUser, findUser, db } from 'db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('auth_token');
	if (token) {
		cookies.delete('auth_token');
		await userCache(token, undefined, 'delete');
	}
	return { newUserSchema: newUser.schema, findUserSchema: findUser.schema };
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const { data, errors } = await findUser.validate(request.formData());
		if (errors) return fail(400, errors);

		const res = await db
			.selectFrom('users')
			.where('username', '=', data.username)
			.where('password', '=', data.password)
			.select(['username', 'id'])
			.executeTakeFirst();
		if (!res) return fail(400, { error: 'invalid username or password' });

		const token = await userCache('uuid', { username: res.username, id: res.id }, 60 * 60 * 24);
		if (!token) return fail(500, { error: 'unable to login' });

		cookies.set('auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24
		});

		throw redirect(303, '/');
	},
	signup: async ({ request, cookies }) => {
		const { data, errors } = await newUser.validate(request.formData());
		if (errors) return fail(400, errors);

		const res = await db.insertInto('users').values(data).returning(['username', 'id']).executeTakeFirst();
		if (!res) return fail(500, { error: 'unable to create the user' });

		const token = await userCache('uuid', { username: res.username, id: res.id }, 60 * 60 * 24);
		if (!token) return fail(500, { error: 'unable to log-in the created user' });

		cookies.set('auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24
		});

		throw redirect(303, '/');
	}
};
