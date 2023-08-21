import { ActionFailure, fail } from '@sveltejs/kit';
import type z from 'zod';

export const zodDefault = <T extends z.ZodObject<z.ZodRawShape>['shape']>(object: T) => {
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

export const zodSchema = <T extends z.ZodObject<z.ZodRawShape>['shape']>(object: T) => {
  const shape = {} as Record<string, unknown>;

  for (const key of Object.keys(object)) shape[key] = key;

  return shape as { [K in keyof T]: K };
};

export const formatZodError = <Err extends z.ZodError>(
  error: Err
): ActionFailure<Err extends z.ZodError<infer Res> ? Record<keyof Res, string> : never> => {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => (errors[err.path[0]] = err.message));

  return fail(400, errors) as any;
};

export const formatDbError = (err: any): ActionFailure<{ error: string }> => {
  let error: string = err.message;

  if (error.includes('unique constraint')) {
    const constraint = error
      .match(/"([^"]+)"/g)![0]
      .slice(1, -1)
      .split('_');

    error = `${constraint[constraint.length - 2]} already used`;
  }

  return fail(400, { error });
};
