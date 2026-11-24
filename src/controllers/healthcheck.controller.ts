import { Controller, Get } from '@nestjs/common';
import { version, name } from '../../package.json';

@Controller('hc')
export class HealthcheckController {
    @Get()
    healthcheck(): {
        status: number;
        name: string;
        version: string;
        timestamp: string;
    } {
        return {
            status: 200,
            version,
            name,
            timestamp: new Date().toISOString(),
        };
    }
}
