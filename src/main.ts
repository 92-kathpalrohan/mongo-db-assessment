import { NestFactory } from '@nestjs/core';
import { config } from './common/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version } from '../package.json';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );

    const document = SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
            .setTitle('Restaurant Discovery API')
            .setDescription('MongoDB-backed restaurant discovery MVP')
            .setVersion(version)
            .addApiKey(
                { type: 'apiKey', name: 'x-api-key', in: 'header' },
                'x-api-key',
            )
            .build(),
    );
    SwaggerModule.setup('docs', app, document);

    await app.listen(config.port);
}
void bootstrap();
