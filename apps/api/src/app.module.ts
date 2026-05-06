import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { DirectConversationsModule } from './direct-conversations/direct-conversations.module';
import { MessagesModule } from './messages/messages.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
		}),
		AuthModule,
		ChannelsModule,
		DirectConversationsModule,
		MessagesModule,
		PrismaModule,
		ProfilesModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
