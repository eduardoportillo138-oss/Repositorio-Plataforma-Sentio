import { type Model, Types } from 'mongoose';
import { type SearchProvider } from './providers/search-provider';
import { type SearchHistory } from './schemas/search-history.schema';
import { SearchService } from './search.service';

describe('SearchService', () => {
  it('si no puede guardar el historial, la búsqueda sigue funcionando', async () => {
    const updateOne = jest.fn(() => ({ exec: () => Promise.reject(new Error('mongo caído')) }));
    const page = { edges: [], pageInfo: {} };
    const searchUsers = jest.fn().mockResolvedValue(page);
    const provider = { searchUsers, searchPosts: jest.fn() } as unknown as SearchProvider;
    const service = new SearchService({ updateOne } as unknown as Model<SearchHistory>, provider);
    await expect(service.searchUsers(new Types.ObjectId().toHexString(), 'Ána', {})).resolves.toBe(
      page,
    );
    expect(searchUsers).toHaveBeenCalledWith('ana', {});
  });
});
