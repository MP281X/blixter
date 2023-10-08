import type { userCache } from 'cache';

declare global {
  namespace App {
    interface Locals {
      user: Exclude<Awaited<ReturnType<typeof userCache>>, string | undefined>;
    }
  }
}

export { };
