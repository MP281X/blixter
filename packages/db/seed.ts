import { db, newUser } from './index.ts';

console.log('seeding');

const admin_input = (
	await newUser.validate(undefined, {
		username: 'admin',
		password: 'password',
		email: 'admin@gmail.com'
	})
).data!;

await db.insertInto('users').values(admin_input).executeTakeFirst();

await db.destroy();
