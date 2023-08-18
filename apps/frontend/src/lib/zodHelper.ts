import type z from 'zod';

const zodDefault = <T extends z.ZodObject<z.ZodRawShape>['shape']>(object: T) => {
	const shape = {} as Record<string, unknown>;

	for (const [key, value] of Object.entries(object)) {
		const typeName = value._def.typeName;

		if (typeName === 'ZodString') shape[key] = '';
		else if (typeName === 'ZodArray') shape[key] = [];
		else if (typeName === 'ZodNumber') shape[key] = 0;
		else if (typeName === 'ZodBoolean') shape[key] = false;
		else if (typeName === 'ZodEnum') shape[key] = value._def.values[0];
		else if (typeName === 'ZodDefault') shape[key] = value._def.defaultValue();
	}

	return shape as { [K in keyof T]: T[K]['_output'] };
};

const zodSchema = <T extends z.ZodObject<z.ZodRawShape>['shape']>(object: T) => {
	const shape = {} as Record<string, unknown>;

	for (const key of Object.keys(object)) shape[key] = key;

	return shape as { [K in keyof T]: K };
};

export { zodDefault, zodSchema };
