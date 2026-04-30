import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { DirectConversationsController } from './direct-conversations.controller';
import { DirectConversationsService } from './direct-conversations.service';

@Module({
	imports: [AuthModule, ProfilesModule],
	controllers: [DirectConversationsController],
	providers: [DirectConversationsService]
})
export class DirectConversationsModule {}
