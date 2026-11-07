import { type Connection, Types } from 'mongoose';
import { BLOCKS_COLLECTION, BlockChecker } from './block-checker';

describe('BlockChecker', () => {
  it('no consulta si no hay ids válidos', async () => {
    const collection = jest.fn();
    const checker = new BlockChecker({ collection } as unknown as Connection);
    await expect(checker.blockedBy(new Types.ObjectId().toHexString(), ['x'])).resolves.toEqual(
      new Set(),
    );
    expect(collection).not.toHaveBeenCalled();
  });

  it('devuelve quiénes bloquearon al usuario', async () => {
    const blocker = new Types.ObjectId();
    const toArray = jest.fn().mockResolvedValue([{ blockerId: blocker }]);
    const find = jest.fn(() => ({ toArray }));
    const collection = jest.fn(() => ({ find }));
    const checker = new BlockChecker({ collection } as unknown as Connection);
    const result = await checker.blockedBy(new Types.ObjectId().toHexString(), [
      blocker.toHexString(),
      new Types.ObjectId().toHexString(),
    ]);
    expect(collection).toHaveBeenCalledWith(BLOCKS_COLLECTION);
    expect(result).toEqual(new Set([blocker.toHexString()]));
  });
});
