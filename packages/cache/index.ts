import { getSet } from './src/helpers';

export const userCache = getSet<{ username: string; id: string }>('user');
