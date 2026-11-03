import { Errors } from '../errors/app-error';

/**
 * Cursor opaco: base64url de una tupla [valorDeOrden, id]. Los clientes no deben interpretarlo.
 * El prefijo de versión permite cambiar el formato sin romper cursores viejos de forma silenciosa.
 */
const VERSION = 'v1';

export type CursorValue = string | number;

export interface CursorPayload {
  /** Valor del campo de orden (Date se serializa como epoch ms). */
  key: CursorValue;
  /** Desempate estable por _id. */
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify([VERSION, payload.key, payload.id]), 'utf8').toString(
    'base64url',
  );
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed[0] === VERSION &&
      (typeof parsed[1] === 'string' || typeof parsed[1] === 'number') &&
      typeof parsed[2] === 'string'
    ) {
      return { key: parsed[1], id: parsed[2] };
    }
  } catch {
    // cae al error de abajo
  }
  throw Errors.badInput('Cursor de paginación inválido.');
}
