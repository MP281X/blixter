import type { userCache } from 'cache';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: Exclude<Awaited<ReturnType<typeof userCache>>, string | undefined>;
		}
	}
}

export {};
