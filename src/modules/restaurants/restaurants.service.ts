import { Injectable } from '@nestjs/common';
import { RestaurantRepository } from '../../databases/mongo/restaurants/restaurant.repository';
import {
    NewRestaurantEntity,
    RestaurantEntity,
    RestaurantQuery,
    RestaurantSearchResult,
} from './restaurant.entity';

@Injectable()
export class RestaurantsService {
    constructor(private readonly restaurantRepository: RestaurantRepository) {}

    // No creation rules yet; this is where they go (e.g. duplicate checks).
    async create(restaurant: NewRestaurantEntity): Promise<RestaurantEntity> {
        return this.restaurantRepository.create(restaurant);
    }

    async findById(id: string): Promise<RestaurantEntity | null> {
        return this.restaurantRepository.findById(id);
    }

    async list(query: RestaurantQuery): Promise<RestaurantSearchResult[]> {
        return this.restaurantRepository.list(query);
    }
}
