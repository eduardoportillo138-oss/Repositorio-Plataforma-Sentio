import { Field, Int, ObjectType } from '@nestjs/graphql';
import { PostModel } from '../../posts/dto/post.dto';

@ObjectType('SharePostResult')
export class SharePostResultModel {
  @Field(() => PostModel, { description: 'El post con counts.shares actualizado.' })
  post!: PostModel;

  @Field(() => Int, { description: 'A cuántas personas se envió.' })
  sentTo!: number;
}
