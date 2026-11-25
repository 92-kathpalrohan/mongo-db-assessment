import { Injectable } from '@nestjs/common';
import { RestaurantRepository } from '../../databases/mongo/restaurants/restaurant.repository';
import {
    NewRestaurantEntity,
    RestaurantEntity,
    RestaurantQuery,
    RestaurantSearchResult,
} from './restaurant.entity';
import { ParsedSearch, parseSearchQuery } from './search-query.parser';

@Injectable()
export class RestaurantsService {
    // Loaded on the first search and kept in memory; a brand-new city or
    // cuisine is recognised after a restart.
    private vocabulary?: Promise<{ cities: string[]; cuisines: string[] }>;

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

    async parseSearch(q: string): Promise<ParsedSearch> {
        this.vocabulary ??= this.restaurantRepository.searchVocabulary();
        return parseSearchQuery(q, await this.vocabulary);
    }
}
