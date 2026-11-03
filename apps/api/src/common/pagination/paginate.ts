import { type FilterQuery, type Model, Types } from 'mongoose';
import { Errors } from '../errors/app-error';
import { type Connection, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './connection.type';
import { type CursorValue, decodeCursor, encodeCursor } from './cursor';

export interface PaginateOptions<TDoc> {
  filter?: FilterQuery<TDoc>;
  /** Campo de orden (debe estar indexado junto con _id). Por defecto `createdAt`. */
  sortField?: keyof TDoc & string;
  /** -1 = más recientes primero (feed). */
  direction?: 1 | -1;
  first?: number | null;
  after?: string | null;
}

/**
 * Paginación keyset (sin skip) sobre cualquier modelo de Mongoose, estable ante inserciones.
 * Ordena por (sortField, _id) y pide `first + 1` documentos para saber si hay más página.
 */
export async function paginate<TDoc extends { _id: Types.ObjectId }, TNode>(
  model: Model<TDoc>,
  toNode: (doc: TDoc) => TNode,
  options: PaginateOptions<TDoc> = {},
): Promise<Connection<TNode>> {
  const sortField = options.sortField ?? ('createdAt' as keyof TDoc & string);
  const direction = options.direction ?? -1;
  const first = options.first ?? DEFAULT_PAGE_SIZE;
  if (first < 1 || first > MAX_PAGE_SIZE) {
    throw Errors.badInput(`"first" debe estar entre 1 y ${MAX_PAGE_SIZE}.`);
  }

  const conditions: FilterQuery<TDoc>[] = [];
  if (options.filter) conditions.push(options.filter);

  if (options.after) {
    const { key, id } = decodeCursor(options.after);
    if (!Types.ObjectId.isValid(id)) throw Errors.badInput('Cursor de paginación inválido.');
    const value = sortField === '_id' ? new Types.ObjectId(id) : fromCursorKey(key, sortField);
    const op = direction === -1 ? '$lt' : '$gt';
    conditions.push({
      $or: [
        { [sortField]: { [op]: value } },
        { [sortField]: value, _id: { [op]: new Types.ObjectId(id) } },
      ],
    } as FilterQuery<TDoc>);
  }

  const query = conditions.length > 1 ? { $and: conditions } : (conditions[0] ?? {});
  const docs = (await model
    .find(query as FilterQuery<TDoc>)
    .sort({ [sortField]: direction, _id: direction })
    .limit(first + 1)
    .lean()
    .exec()) as TDoc[];

  const hasNextPage = docs.length > first;
  const page = hasNextPage ? docs.slice(0, first) : docs;
  const edges = page.map((doc) => ({
    cursor: encodeCursor({ key: toCursorKey(doc[sortField]), id: doc._id.toHexString() }),
    node: toNode(doc),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: Boolean(options.after),
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges.at(-1)?.cursor ?? null,
    },
  };
}

function toCursorKey(value: unknown): CursorValue {
  if (value instanceof Date) return value.getTime();
  if (value instanceof Types.ObjectId) return value.toHexString();
  if (typeof value === 'string' || typeof value === 'number') return value;
  throw new Error('El campo de orden de la paginación debe ser Date, número, string u ObjectId.');
}

function fromCursorKey(key: CursorValue, sortField: string): unknown {
  // Por convención los campos *At son fechas; el resto se compara tal cual.
  return typeof key === 'number' && sortField.endsWith('At') ? new Date(key) : key;
}
