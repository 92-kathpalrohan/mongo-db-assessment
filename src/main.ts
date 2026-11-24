import { createApp } from './app';
import { config } from './common/config';

async function bootstrap() {
    const app = await createApp();
    await app.listen(config.port);
}
void bootstrap();
