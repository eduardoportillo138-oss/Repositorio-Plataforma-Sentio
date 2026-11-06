import { Field, InputType } from '@nestjs/graphql';
import { defaultJoinPolicy, GroupVisibility, isJoinPolicyAllowed, JoinPolicy } from '@sentio/core';
import { z } from 'zod';

@InputType()
export class CreateGroupInput {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => GroupVisibility, { nullable: true, defaultValue: GroupVisibility.PRIVATE })
  visibility?: GroupVisibility;

  @Field(() => JoinPolicy, {
    nullable: true,
    description:
      'Si se omite: INVITE_ONLY para SECRET, REQUEST para PRIVATE y OPEN para PUBLIC. ' +
      'Un grupo SECRET solo admite INVITE_ONLY.',
  })
  joinPolicy?: JoinPolicy | null;
}

export const createGroupSchema = z
  .object({
    name: z.string().trim().min(3).max(80),
    description: z.string().trim().max(1000).nullish(),
    visibility: z.enum(GroupVisibility).default(GroupVisibility.PRIVATE),
    joinPolicy: z.enum(JoinPolicy).nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.joinPolicy && !isJoinPolicyAllowed(data.visibility, data.joinPolicy)) {
      ctx.addIssue({
        code: 'custom',
        path: ['joinPolicy'],
        message: 'Un grupo secreto solo admite la política de ingreso por invitación.',
      });
    }
  })
  .transform((data) => ({
    ...data,
    joinPolicy: data.joinPolicy ?? defaultJoinPolicy(data.visibility),
  }));

export type CreateGroupData = z.output<typeof createGroupSchema>;
