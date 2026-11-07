import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { type SharePostInput, sharePostSchema } from '@sentio/core';
import { type Connection, Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { NotificationsService } from '../notifications/notifications.service';
import { isVisibleTo, PostsService } from '../posts/posts.service';
import { type Post } from '../posts/schemas/post.schema';
import { UsersService } from '../users/users.service';
import { BlockChecker } from './blocks/block-checker';
import { Share } from './schemas/share.schema';

const sharePipe = new ZodValidationPipe(sharePostSchema);

const invalidRecipients = () =>
  Errors.badInput('Destinatarios inválidos.', {
    recipientIds: ['validation.share.recipientsInvalid'],
  });

@Injectable()
export class SharesService {
  constructor(
    @InjectModel(Share.name) private readonly model: Model<Share>,
    @InjectConnection() private readonly connection: Connection,
    private readonly posts: PostsService,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
    private readonly blocks: BlockChecker,
  ) {}

  /**
   * Comparte un post público con hasta 10 personas. Por cada destinatario crea un `share` y
   * una notificación, y suma `counts.shares`, todo en una transacción. A quienes bloquearon
   * al remitente se los omite sin avisar (no se revela el bloqueo).
   */
  async share(senderId: string, raw: SharePostInput): Promise<{ post: Post; sentTo: number }> {
    const input = sharePipe.transform(raw);
    const post = await this.posts.findVisible(input.postId, senderId);
    if (!post) throw Errors.notFound('Publicación');
    if (!isVisibleTo(post, null)) {
      throw Errors.forbidden('Solo se pueden compartir publicaciones públicas.');
    }

    const recipientIds = input.recipientIds.map((id) => id.toLowerCase());
    if (recipientIds.includes(senderId)) throw invalidRecipients();
    const recipients = await this.users.findByIds(recipientIds);
    const active = recipients.filter((u) => u.status === 'active');
    if (active.length !== recipientIds.length) throw invalidRecipients();

    const blocked = await this.blocks.blockedBy(senderId, recipientIds);
    const targets = recipientIds.filter((id) => !blocked.has(id));

    const created = await this.connection.transaction(async (session) => {
      if (targets.length === 0) return [];
      await this.model.insertMany(
        targets.map((recipientId) => ({
          postId: post._id,
          senderId: new Types.ObjectId(senderId),
          recipientId: new Types.ObjectId(recipientId),
          message: input.message ?? null,
        })),
        { session },
      );
      await this.posts.incrementCounts(post._id, { shares: targets.length }, session);
      return this.notifications.createMany(
        targets.map((userId) => ({
          userId,
          type: 'share' as const,
          actorId: senderId,
          entity: { kind: 'post', id: post._id },
          message: input.message ?? null,
        })),
        session,
      );
    });

    this.notifications.emitCreated(created);
    const fresh = await this.posts.findById(post._id.toHexString());
    return { post: fresh ?? post, sentTo: targets.length };
  }
}
