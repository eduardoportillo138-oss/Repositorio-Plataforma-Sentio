import { Module } from '@nestjs/common';
import { UsersModule } from '../../modules/users/users.module';
import { DataloaderService } from './dataloader.service';

@Module({
  imports: [UsersModule],
  providers: [DataloaderService],
  exports: [DataloaderService],
})
export class DataloaderModule {}
