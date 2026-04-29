import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';

@Module({
	imports: [AuthModule, ProfilesModule],
	controllers: [ChannelsController],
	providers: [ChannelsService]
})
export class ChannelsModule {}
