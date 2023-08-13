import 'dotenv/config';
import { db } from './index.js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

try {
	await migrate(db, { migrationsFolder: './drizzle' });
	console.log('migration ended');
} catch (err) {
	console.log(err);
}

process.exit(0);
