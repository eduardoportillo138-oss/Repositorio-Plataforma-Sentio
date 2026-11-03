import { type PipeTransform } from '@nestjs/common';
import { type z } from 'zod';
import { Errors } from '../errors/app-error';

/**
 * Valida y normaliza un argumento con un schema zod de @sentio/core,
 * para que web, móvil y API apliquen exactamente las mismas reglas.
 */
export class ZodValidationPipe<S extends z.ZodType> implements PipeTransform<unknown, z.output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.output<S> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      (fieldErrors[key] ??= []).push(issue.message);
    }
    throw Errors.badInput('Datos inválidos.', fieldErrors);
  }
}
