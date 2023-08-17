import type { userCache } from 'cache';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: Awaited<ReturnType<typeof userCache>>;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
