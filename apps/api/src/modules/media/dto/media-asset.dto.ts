import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

// Etapa 0: tipos base. Se amplían en la Etapa 1.
@ObjectType('MediaAsset')
export class MediaAssetModel {
  @Field(() => ID)
  id!: string;

  @Field()
  kind!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  url!: string | null;
}

@InputType()
export class RequestUploadInput {
  @Field()
  mimeType!: string;

  @Field(() => Int)
  sizeBytes!: number;
}
