import { z } from 'zod';
import { objectIdSchema } from './media';

export const COMMENT_MAX_LENGTH = 1000;
export const SHARE_MAX_RECIPIENTS = 10;
export const SHARE_MESSAGE_MAX_LENGTH = 500;

export const commentTextSchema = z
  .string()
  .trim()
  .min(1, { message: 'validation.comment.required' })
  .max(COMMENT_MAX_LENGTH, { message: 'validation.comment.max' });

export const addCommentSchema = z
  .object({
    postId: objectIdSchema,
    text: commentTextSchema,
  })
  .strict();

export type AddCommentInput = z.infer<typeof addCommentSchema>;

/** Mensaje opcional: vacío o solo espacios equivale a no enviar mensaje. */
const shareMessageSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z
    .string()
    .trim()
    .max(SHARE_MESSAGE_MAX_LENGTH, { message: 'validation.share.messageMax' })
    .nullable()
    .optional(),
);

export const sharePostSchema = z
  .object({
    postId: objectIdSchema,
    recipientIds: z
      .array(objectIdSchema)
      .min(1, { message: 'validation.share.recipientsRequired' })
      .max(SHARE_MAX_RECIPIENTS, { message: 'validation.share.recipientsMax' })
      .refine((ids) => new Set(ids.map((id) => id.toLowerCase())).size === ids.length, {
        message: 'validation.share.recipientsDuplicate',
      }),
    message: shareMessageSchema,
  })
  .strict();

export type SharePostInput = z.input<typeof sharePostSchema>;
export type SharePostData = z.output<typeof sharePostSchema>;
