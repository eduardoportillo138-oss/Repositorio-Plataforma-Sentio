/**
 * Llena los campos normalizados de búsqueda (searchName, searchTitle, searchText) en los
 * documentos existentes. Uso: pnpm --filter @sentio/api search:backfill
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { type Model } from 'mongoose';
import { AppModule } from '../app.module';
import { type Post } from '../modules/posts/schemas/post.schema';
import { backfillSearchFields } from '../modules/search/backfill';
import { type User } from '../modules/users/schemas/user.schema';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const result = await backfillSearchFields(
      app.get<Model<User>>(getModelToken('User')),
      app.get<Model<Post>>(getModelToken('Post')),
    );
    process.stdout.write(
      `Campos de búsqueda actualizados: ${result.users} usuarios, ${result.posts} publicaciones\n`,
    );
  } finally {
    await app.close();
  }
}

void main();
