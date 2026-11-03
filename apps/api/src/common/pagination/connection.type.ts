import { type Type } from '@nestjs/common';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;

  @Field(() => String, { nullable: true })
  startCursor!: string | null;

  @Field(() => String, { nullable: true })
  endCursor!: string | null;
}

/** Argumentos Relay de paginación hacia adelante (scroll infinito). */
@ArgsType()
export class ConnectionArgs {
  @Field(() => Int, { nullable: true, defaultValue: DEFAULT_PAGE_SIZE })
  first?: number;

  @Field(() => String, { nullable: true })
  after?: string | null;
}

export interface Edge<T> {
  cursor: string;
  node: T;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

/**
 * Crea los tipos `XEdge` y `XConnection` para un nodo GraphQL.
 * Uso: `@ObjectType() export class UserConnection extends Paginated(UserModel, 'User') {}`
 * @param name nombre GraphQL del nodo (por defecto el de la clase); genera `<name>Edge`.
 */
export function Paginated<T>(nodeType: Type<T>, name = nodeType.name): Type<Connection<T>> {
  @ObjectType(`${name}Edge`)
  abstract class EdgeType implements Edge<T> {
    @Field()
    cursor!: string;

    @Field(() => nodeType)
    node!: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class ConnectionType implements Connection<T> {
    @Field(() => [EdgeType])
    edges!: Edge<T>[];

    @Field(() => PageInfo)
    pageInfo!: PageInfo;
  }

  return ConnectionType as unknown as Type<Connection<T>>;
}
