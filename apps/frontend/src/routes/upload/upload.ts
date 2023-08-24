import { z } from 'zod';
import { writable } from 'svelte/store';

export const schema = z.object({
	_id: z.string().nonempty({ message: 'video not found' }),
	_format: z.enum(['mp4'], { invalid_type_error: 'video not found' }),
	name: z.string().min(5).max(20),
	description: z.string().max(500)
});

export const videoInfo = writable<{
	id: string;
	format: string;
}>({ id: '', format: '' });
