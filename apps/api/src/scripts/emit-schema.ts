/**
 * Genera packages/graphql/schema.graphql sin conectarse a MongoDB ni a Redis.
 * Uso: pnpm --filter @sentio/api schema:emit
 */
import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { lexicographicSortSchema, printSchema } from 'graphql';
import { SCHEMA_FILE } from '../common/graphql/graphql.options';
import { AuthResolver } from '../modules/auth/auth.resolver';
import { CommentsResolver } from '../modules/comments/comments.resolver';
import { GroupMemberResolver, GroupsResolver } from '../modules/groups/groups.resolver';
import { MediaResolver } from '../modules/media/media.resolver';
import { NotificationsResolver } from '../modules/notifications/notifications.resolver';
import { PostsResolver } from '../modules/posts/posts.resolver';
import { ReactionsResolver } from '../modules/reactions/reactions.resolver';
import { SearchResolver } from '../modules/search/search.resolver';
import { SharesResolver } from '../modules/shares/shares.resolver';
import { UsersResolver } from '../modules/users/users.resolver';

/** Resolvers que aportan campos al schema. Cada resolver nuevo debe agregarse aquí. */
const RESOLVERS = [
  AuthResolver,
  UsersResolver,
  MediaResolver,
  PostsResolver,
  ReactionsResolver,
  CommentsResolver,
  SharesResolver,
  NotificationsResolver,
  SearchResolver,
  GroupsResolver,
  GroupMemberResolver,
];

async function main(): Promise<void> {
  const app = await NestFactory.create(GraphQLSchemaBuilderModule, { logger: ['error'] });
  await app.init();
  const factory = app.get(GraphQLSchemaFactory);
  const schema = await factory.create(RESOLVERS);
  const sdl = `# Generado por apps/api (pnpm --filter @sentio/api schema:emit). No editar a mano.\n\n${printSchema(lexicographicSortSchema(schema))}\n`;
  writeFileSync(SCHEMA_FILE, sdl, 'utf8');
  await app.close();
  process.stdout.write(`Schema escrito en ${SCHEMA_FILE}\n`);
}

void main();
