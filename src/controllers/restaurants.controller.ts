import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { RestaurantsService } from '../modules/restaurants/restaurants.service';
import { CreateRestaurantDto } from './dtos/restaurant/create-restaurant.dto';
import { ListRestaurantsDto } from './dtos/restaurant/list-restaurants.dto';
import {
    RestaurantListResponseDto,
    RestaurantResponseDto,
} from './dtos/restaurant/restaurant-response.dto';
import {
    toNewRestaurantEntity,
    toRestaurantListItem,
    toRestaurantQuery,
    toRestaurantResponse,
} from './dtos/restaurant/restaurant.mapper';

@UseGuards(ApiKeyGuard)
@ApiSecurity('x-api-key')
@Controller('v1/restaurants')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) {}

    @Post()
    async create(
        @Body() dto: CreateRestaurantDto,
    ): Promise<RestaurantResponseDto> {
        const created = await this.restaurantsService.create(
            toNewRestaurantEntity(dto),
        );
        return toRestaurantResponse(created);
    }

    @Get()
    async list(
        @Query() dto: ListRestaurantsDto,
    ): Promise<RestaurantListResponseDto> {
        const query = toRestaurantQuery(dto);
        const results = await this.restaurantsService.list(query);
        return {
            items: results.map(toRestaurantListItem),
            limit: query.limit,
            offset: query.offset,
        };
    }

    @Get(':id')
    async findById(@Param('id') id: string): Promise<RestaurantResponseDto> {
        const restaurant = await this.restaurantsService.findById(id);
        if (!restaurant) {
            throw new NotFoundException(`Restaurant ${id} not found`);
        }
        return toRestaurantResponse(restaurant);
    }
}
