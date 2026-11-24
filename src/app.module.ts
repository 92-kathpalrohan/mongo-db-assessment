import { Module } from '@nestjs/common';
import { HealthcheckController } from './controllers/healthcheck.controller';
import { MongoModule } from './databases/mongo/mongo.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { RestaurantsController } from './controllers/restaurants.controller';

@Module({
    imports: [MongoModule, RestaurantsModule],
    controllers: [HealthcheckController, RestaurantsController],
    providers: [],
})
export class AppModule {}
