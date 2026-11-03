import { Field, InputType } from '@nestjs/graphql';
import { GroupVisibility } from '@sentio/core';
import { z } from 'zod';

@InputType()
export class CreateGroupInput {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => GroupVisibility, { nullable: true, defaultValue: GroupVisibility.PRIVATE })
  visibility?: GroupVisibility;
}

export const createGroupSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(1000).nullish(),
  visibility: z.enum(GroupVisibility).default(GroupVisibility.PRIVATE),
});

export type CreateGroupData = z.output<typeof createGroupSchema>;
