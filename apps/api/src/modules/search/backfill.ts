import { type AnyBulkWriteOperation, type Model } from 'mongoose';
import { type Post } from '../posts/schemas/post.schema';
import { type User } from '../users/schemas/user.schema';
import { postSearchFields, userSearchName } from './search-fields';

const BATCH = 500;

/**
 * Calcula los campos normalizados de búsqueda en los documentos que ya existían antes de esta
 * versión (o que quedaron desactualizados). Idempotente: solo escribe lo que cambia.
 */
export async function backfillSearchFields(
  users: Model<User>,
  posts: Model<Post>,
): Promise<{ users: number; posts: number }> {
  let userOps: AnyBulkWriteOperation<User>[] = [];
  let userCount = 0;
  for await (const u of users
    .find({}, { handle: 1, displayName: 1, searchName: 1 })
    .lean<Pick<User, '_id' | 'handle' | 'displayName' | 'searchName'>>()
    .cursor()) {
    const searchName = userSearchName(u.displayName, u.handle);
    if (u.searchName === searchName) continue;
    userOps.push({ updateOne: { filter: { _id: u._id }, update: { $set: { searchName } } } });
    if (userOps.length >= BATCH) {
      userCount += (await users.bulkWrite(userOps)).modifiedCount;
      userOps = [];
    }
  }
  if (userOps.length) userCount += (await users.bulkWrite(userOps)).modifiedCount;

  let postOps: AnyBulkWriteOperation<Post>[] = [];
  let postCount = 0;
  for await (const p of posts
    .find({}, { title: 1, text: 1, searchTitle: 1, searchText: 1 })
    .lean<Pick<Post, '_id' | 'title' | 'text' | 'searchTitle' | 'searchText'>>()
    .cursor()) {
    const fields = postSearchFields(p.title, p.text ?? '');
    if (p.searchTitle === fields.searchTitle && p.searchText === fields.searchText) continue;
    postOps.push({ updateOne: { filter: { _id: p._id }, update: { $set: fields } } });
    if (postOps.length >= BATCH) {
      postCount += (await posts.bulkWrite(postOps)).modifiedCount;
      postOps = [];
    }
  }
  if (postOps.length) postCount += (await posts.bulkWrite(postOps)).modifiedCount;

  return { users: userCount, posts: postCount };
}
