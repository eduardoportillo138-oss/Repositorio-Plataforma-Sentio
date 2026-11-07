import { z } from 'zod';

export const POST_TITLE_MAX_LENGTH = 120;
export const POST_TEXT_MAX_LENGTH = 5000;

/** Visibilidades que se pueden elegir al publicar (los posts de grupo llegan en otra fase). */
export const POST_VISIBILITIES = ['public', 'followers'] as const;
export type PostVisibility = (typeof POST_VISIBILITIES)[number];

export const postTitleSchema = z
  .string()
  .trim()
  .min(1, { message: 'validation.post.titleRequired' })
  .max(POST_TITLE_MAX_LENGTH, { message: 'validation.post.titleMax' });

export const postTextSchema = z
  .string()
  .trim()
  .max(POST_TEXT_MAX_LENGTH, { message: 'validation.post.textMax' });

export const createPostSchema = z
  .object({
    title: postTitleSchema,
    text: postTextSchema.default(''),
    visibility: z
      .enum(POST_VISIBILITIES, { message: 'validation.post.visibility' })
      .default('public'),
  })
  .strict();

export type CreatePostInput = z.input<typeof createPostSchema>;
export type CreatePostData = z.output<typeof createPostSchema>;
