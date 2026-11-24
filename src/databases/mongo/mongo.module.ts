import { Module, OnModuleInit } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { buildMongoUri } from '../../common/utils';
import { Restaurant, RestaurantSchema } from './restaurants/restaurant.schema';
import { config } from '../../common/config';
import { MongoService } from './mongo.service';
import { RestaurantRepository } from './restaurants/restaurant.repository';

@Module({
    imports: [
        MongooseModule.forRoot(
            buildMongoUri(config.mongodb, { isLocal: config.isLocal }),
            { autoIndex: false },
        ),
        MongooseModule.forFeature([
            {
                name: Restaurant.name,
                schema: RestaurantSchema,
            },
        ]),
    ],
    providers: [MongoService, RestaurantRepository],
    // Only repositories are public: nothing outside this module can inject a
    // Mongoose model and bypass the repository/mapper.
    exports: [MongoService, RestaurantRepository],
})
export class MongoModule implements OnModuleInit {
    constructor(@InjectConnection() private readonly connection: Connection) {}

    onModuleInit(): void {
        if (this.connection.readyState === ConnectionStates.connected) {
            console.log('MongoDB connected at startup');
        }

        this.connection.on('connected', () => {
            console.log('MongoDB connected');
        });

        this.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        this.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
    }
}
