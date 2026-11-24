import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version } from '../package.json';
import { AppModule } from './app.module';

// Builds the fully configured app. main.ts listens on it; tests call
// init() on it, so both run exactly the same setup.
export async function createApp(): Promise<INestApplication> {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        }),
    );
    setupSwagger(app);
    return app;
}

function setupSwagger(app: INestApplication): void {
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
}
