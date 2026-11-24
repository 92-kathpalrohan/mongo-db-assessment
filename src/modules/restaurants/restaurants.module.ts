import { Module } from '@nestjs/common';
import { MongoModule } from '../../databases/mongo/mongo.module';
import { RestaurantsService } from './restaurants.service';

@Module({
    imports: [MongoModule],
    providers: [RestaurantsService],
    exports: [RestaurantsService],
})
export class RestaurantsModule {}
