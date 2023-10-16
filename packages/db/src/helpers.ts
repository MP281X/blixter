// @ts-expect-error
import pg from 'pg';
import { createHash } from 'node:crypto';
import { Kysely, PostgresDialect, sql } from 'kysely';
import type { DB } from '../index.g.d.ts';
import type { InsertObject, SelectType, UpdateQueryBuilder, SelectQueryBuilder, InsertQueryBuilder } from 'kysely';
import { ZodError, z } from 'zod';

export { sql, z };

// db instance
const env = typeof Bun !== 'undefined' ? Bun.env : process.env;
export const db = new Kysely<DB>({
	dialect: new PostgresDialect({
		pool: new pg.Pool({
			connectionString: env.POSTGRES_URL
		})
	})
});

process.on('exit', () => {
	db.destroy();
	console.log('db -> disconnect');
});

// type helper (transform the db schema into a zod schema)
type ValidatorSchema<Table extends keyof DB> = {
	[K in keyof InsertObject<DB, Table>]+?: z.ZodType<SelectType<DB[Table][K]>>;
} & Record<`_${string}`, z.ZodType>;

// type helper (transform a zod schema into an object)
type InputSchema<Schema extends ValidatorSchema<any>> = {
	[K in keyof Schema]: NonNullable<Schema[K]>['_type'];
};

// type helper (output the keys of the table that are missing from the formData)
type MissingSchema<
	Table extends keyof DB,
	Type extends 'update' | 'select' | 'insert',
	CurrentSchema extends Record<string, any>
> = Type extends 'insert'
	? {
			[K in keyof InsertObject<DB, Table> as K extends keyof CurrentSchema ? never : K]: SelectType<DB[Table][K]>;
	  }
	: Type extends 'update'
	? {
			[K in keyof InsertObject<DB, Table> as K extends keyof CurrentSchema ? never : K extends `${string}id` ? K : never]: SelectType<DB[Table][K]>;
	  } & {
			[K in keyof InsertObject<DB, Table> as K extends keyof CurrentSchema ? never : K extends `${string}id` ? never : K]+?: SelectType<DB[Table][K]>;
	  }
	: {
			[K in keyof InsertObject<DB, Table> as K extends keyof CurrentSchema ? never : K]+?: SelectType<DB[Table][K]>;
	  };

// type helper for the db type
type DBQueryBuilder<Type extends 'update' | 'select' | 'insert', Table extends keyof DB> = Type extends 'update'
	? UpdateQueryBuilder<DB, Table, Table, {}>
	: Type extends 'select'
	? SelectQueryBuilder<DB, Table, {}>
	: Type extends 'insert'
	? InsertQueryBuilder<DB, Table, {}>
	: never;

// generate an object with the default values for every key of the zod object
export const zodDefault = <T extends z.ZodObject<z.ZodRawShape>['shape']>(object: T) => {
	const shape = {} as Record<string, unknown>;

	for (const [key, value] of Object.entries(object)) {
		if (key[0] === '_') continue;
		const typeName = value._def.typeName;

		if (typeName === 'ZodString') shape[key] = '';
		else if (typeName === 'ZodArray') shape[key] = [];
		else if (typeName === 'ZodNumber') shape[key] = 0;
		else if (typeName === 'ZodBoolean') shape[key] = false;
		else if (typeName === 'ZodEnum') shape[key] = value._def.values[0];
		else if (typeName === 'ZodDefault') shape[key] = value._def.defaultValue();
		else if (typeName === 'ZodEffects') shape[key] = undefined;
	}

	return shape as { [K in keyof T]: T[K]['_output'] };
};

// handler for validating and inserting the data in the db
export const validator = <
	Table extends keyof DB,
	Type extends 'update' | 'select' | 'insert',
	Schema extends ValidatorSchema<Table>,
	QueryHandler extends (db: DBQueryBuilder<Type, Table>, data: InputSchema<Schema> & MissingSchema<Table, Type, Schema>) => Promise<any>
>(
	table: Table,
	type: Type,
	validatorSchema: Schema,
	queryHandler: QueryHandler
) => {
	const schema = z.object(validatorSchema as any);
	const formDefaults = zodDefault(schema.shape);

	type ValidatorType<T> = Promise<{ data: T; errors: undefined } | { data: undefined; errors: Record<string, string> }>;
	const validate = async <Input extends InputSchema<Schema>>(formData: Promise<FormData>): ValidatorType<Input> => {
		try {
			const rawInput: Record<string, unknown> = Object.fromEntries(await formData.catch(_ => new FormData()));
			const res: any = await schema.parseAsync(rawInput);

			return { data: res, errors: undefined };
		} catch (e) {
			const error = e as ZodError;
			const errors: Record<string, string> = {};

			// error formatting
			error.errors.forEach(err => {
				if ((err.path[0] as string)[0] === '_') errors['error'] = `${(err.path[0] as string).slice(1)} is ${err.message}`;
				else errors[err.path[0]!] = err.message;
			});

			return { errors, data: undefined };
		}
	};

	type QueryType = Promise<
		| {
				data: NonNullable<Awaited<ReturnType<typeof queryHandler>>>;
				validated: NonNullable<Awaited<ReturnType<typeof validate>>['data']>;
				errors: undefined;
		  }
		| { data: undefined; validated: undefined; errors: Record<string, string> }
	>;

	return {
		schema: formDefaults as InputSchema<Schema>,
		query: async (formData: Promise<FormData>, data: MissingSchema<Table, Type, Schema>): QueryType => {
			try {
				let q: any;

				const validated = await validate(formData);

				if (validated.errors) return { errors: validated.errors, validated: undefined, data: undefined };
				Object.entries(validated.data).forEach(([key, value]) => ((data as any)[key] = value));

				if (type === 'select') q = db.selectFrom(table);
				else if (type === 'update') q = db.updateTable(table);
				else if (type === 'insert') q = db.insertInto(table);

				const res = await queryHandler(q, data as any);
				if (res === undefined) return { errors: { error: 'not found' }, validated: undefined, data: undefined };

				return { errors: undefined, validated: validated.data, data: res };
			} catch (e: any) {
				if ('message' in e) console.log(e.message);
				else console.log('errore');

				return { errors: { error: 'db error' }, validated: undefined, data: undefined };
			}
		}
	};
};

export const hashPassword = (password: string) => {
	const salt = env.SALT;
	const hash = createHash('sha256');
	hash.update(password + salt);
	return hash.digest('hex');
};
