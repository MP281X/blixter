// @ts-ignore
import { createHash } from 'node:crypto';
import type { InsertObject, SelectType } from 'kysely';
import type { DB } from '../index.g.d.ts';
import { ZodError, z } from 'zod';

// type helper (transform the db schema into a zod schema)
type ValidatorSchema<Table extends keyof DB, Req extends 'optional' | 'required'> = Req extends 'required'
	? {
			[K in keyof InsertObject<DB, Table>]: z.ZodType<SelectType<DB[Table][K]>>;
	  } & Record<`_${string}`, z.ZodType>
	: {
			[K in keyof InsertObject<DB, Table>]+?: z.ZodType<SelectType<DB[Table][K]>>;
	  } & Record<`_${string}`, z.ZodType>;

// type helper (transform a zod schema into an object)
type InputSchema<Schema extends ValidatorSchema<any, any>> = {
	[K in keyof Schema]: NonNullable<Schema[K]>['_type'];
};

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
type ValidatorType<T> = Promise<{ data: T; errors: undefined } | { data: undefined; errors: Record<string, string> }>;
export const validator = <Table extends keyof DB, Req extends 'optional' | 'required', Schema extends ValidatorSchema<Table, Req>>(
	_: Table,
	__: Req,
	validatorSchema: Schema & (Exclude<keyof Schema, `_${string}` | keyof ValidatorSchema<Table, Req>> extends never ? Schema : never)
) => {
	const schema = z.object(validatorSchema as any);
	const formDefaults = zodDefault(schema.shape);

	return {
		schema: formDefaults,
		validate: async <Input extends InputSchema<Schema>>(
			formData: Promise<FormData> | undefined,
			override: Partial<Input> = {}
		): ValidatorType<Input> => {
			try {
				if (formData === undefined) formData = new Promise((resolve, _) => resolve(new FormData()));
				const rawInput: Record<string, unknown> = Object.fromEntries(await formData.catch(_ => new FormData()));

				Object.entries(override).forEach(([key, value]) => (rawInput[key] = value));
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
		}
	};
};

const env = typeof Bun !== 'undefined' ? Bun.env : process.env;
export const hashPassword = (password: string) => {
	const salt = env.SALT;
	const hash = createHash('sha256');
	hash.update(password + salt);
	return hash.digest('hex');
};
