import { type Provider } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { type Model } from 'mongoose';
import { AppConfigService } from '../../../config/app-config.service';
import { Post } from '../../posts/schemas/post.schema';
import { User } from '../../users/schemas/user.schema';
import { AtlasSearchProvider } from './atlas-search.provider';
import { LocalSearchProvider } from './local-search.provider';
import { SEARCH_PROVIDER, type SearchProvider } from './search-provider';

export function createSearchProvider(
  config: AppConfigService,
  users: Model<User>,
  posts: Model<Post>,
): SearchProvider {
  if (config.get('SEARCH_PROVIDER') === 'atlas') {
    return new AtlasSearchProvider(users, posts, {
      users: config.get('ATLAS_SEARCH_USERS_INDEX'),
      posts: config.get('ATLAS_SEARCH_POSTS_INDEX'),
    });
  }
  return new LocalSearchProvider(users, posts);
}

/** Elige el motor con SEARCH_PROVIDER=local|atlas. */
export const searchProvider: Provider = {
  provide: SEARCH_PROVIDER,
  inject: [AppConfigService, getModelToken(User.name), getModelToken(Post.name)],
  useFactory: createSearchProvider,
};
