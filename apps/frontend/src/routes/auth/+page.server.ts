import bcrypt from 'bcrypt';
import { userCache } from 'cache';
import { zodSchema } from '$lib/zodHelper';
import { usersSchema, users, db } from 'db';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const loginSchema = zodSchema(usersSchema.select.shape);
const signupSchema = zodSchema(usersSchema.add.shape);

export const load: PageServerLoad = async () => {
	return { loginSchema, signupSchema };
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = usersSchema.select.parse(Object.fromEntries(await request.formData()));

		const res = await db.query.users.findFirst({
			where: (users, { eq }) => eq(users.username, data.username)
		});

		if (!res || !(await bcrypt.compare(data.password, res.password))) throw error(400, 'invalid username or password');

		const token = await userCache('uuid', { username: res.username }, 60 * 60 * 24);

		if (!token) throw error(500, 'unable to login');
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
		const data = usersSchema.add.parse(Object.fromEntries(await request.formData()));

		const hash = await bcrypt.hash(data.password, 10);
		await db.insert(users).values({
			username: data.username,
			email: data.email,
			password: hash
		});

		const token = await userCache('uuid', { username: data.username }, 60 * 60 * 24);

		if (!token) throw error(500, 'unable to login');
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
