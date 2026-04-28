import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: ['http://localhost:5173']
	});
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			transformOptions: {
				enableImplicitConversion: true
			}
		})
	);
	app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

	const swaggerConfig = new DocumentBuilder()
		.setTitle('Sulack API')
		.setDescription('Sulack backend API documentation')
		.setVersion('1.0.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				description: 'Supabase access token'
			},
			'bearer'
		)
		.build();

	const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup('docs', app, swaggerDocument, {
		swaggerOptions: {
			persistAuthorization: true
		}
	});

	const port = Number(process.env.PORT ?? 3000);
	await app.listen(port);
}

void bootstrap();
