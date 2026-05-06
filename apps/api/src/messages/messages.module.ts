import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
	imports: [AuthModule, ProfilesModule],
	controllers: [MessagesController],
	providers: [MessagesService]
})
export class MessagesModule {}
