import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { PagesModule } from '../pages/pages.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PagesModule, AuthModule],
  providers: [CollaborationGateway],
})
export class CollaborationModule {}
