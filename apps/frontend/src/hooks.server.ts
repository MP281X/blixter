import 'db';

import { redirect, type Handle } from '@sveltejs/kit';
import { userCache } from 'cache';

export const handle: Handle = async ({ event, resolve }) => {
  const unauthorized = () => {
    event.cookies.delete('auth_token');
    throw redirect(303, 'auth');
  };

  if (event.url.pathname.split('/')[1] !== 'auth') {
    const token = event.cookies.get('auth_token');

    if (!token) unauthorized();

    const userData = await userCache(token!);
    if (!userData) unauthorized();

    event.locals.user = userData!;
  }

  return await resolve(event);
};
