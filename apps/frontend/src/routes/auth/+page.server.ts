import bcrypt from 'bcrypt';
import { userCache } from 'cache';
import { formatDbError, formatZodError, zodDefault } from '$lib/helpers';
import { newUserSchema, findUserSchema, users, db } from 'db';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('auth_token');
	if (token) {
		cookies.delete('auth_token');
		await userCache(token, undefined, 'delete');
	}
	return { newUserSchema: zodDefault(newUserSchema.shape), findUserSchema: zodDefault(findUserSchema.shape) };
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const formData = findUserSchema.safeParse(Object.fromEntries(await request.formData()));

		if (!formData.success) return formatZodError(formData.error);
		const data = formData.data;

		const res = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.username, data.username)
		});

		if (!res || !(await bcrypt.compare(data.password, res.password))) return fail(400, { error: 'invalid username or password' });

		const token = await userCache('uuid', { username: res.username }, 60 * 60 * 24);

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
		const formData = newUserSchema.safeParse(Object.fromEntries(await request.formData()));

		if (!formData.success) return formatZodError(formData.error);
		const data = formData.data;

		const hash = await bcrypt.hash(data.password, 10);
		try {
			await db.insert(users).values({
				username: data.username,
				email: data.email,
				password: hash
			});
		} catch (e) {
			return formatDbError(e);
		}

		const token = await userCache('uuid', { username: data.username }, 60 * 60 * 24);

		if (!token) return fail(500, { error: 'invalid username or password' });
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
