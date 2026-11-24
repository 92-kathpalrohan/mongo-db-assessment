import {
    NewRestaurantEntity,
    RestaurantEntity,
    RestaurantQuery,
    RestaurantSearchResult,
} from '../../../modules/restaurants/restaurant.entity';
import { NOT_RATED, RATING_BANDS } from '../../../common/constants';
import { CreateRestaurantDto } from './create-restaurant.dto';
import { ListRestaurantsDto } from './list-restaurants.dto';
import {
    RestaurantListItemDto,
    RestaurantResponseDto,
} from './restaurant-response.dto';

// Listing request -> domain query. Defaults live here and nowhere else.
export function toRestaurantQuery(dto: ListRestaurantsDto): RestaurantQuery {
    const sortBy = dto.sortBy ?? 'rating';
    return {
        name: dto.name,
        city: dto.city,
        country: dto.country,
        cuisines: dto.cuisines,
        minRating: dto.minRating,
        maxCostForTwo: dto.maxCostForTwo,
        near:
            dto.lat !== undefined && dto.lng !== undefined
                ? { longitude: dto.lng, latitude: dto.lat }
                : undefined,
        sortBy,
        order: dto.order ?? (sortBy === 'rating' ? 'desc' : 'asc'),
        limit: dto.limit,
        offset: dto.offset,
    };
}

// Domain -> response. Explicit for the same reason: a new entity field is
// only exposed to clients when it's added here.
export function toRestaurantResponse(
    entity: RestaurantEntity,
): RestaurantResponseDto {
    const { coordinates } = entity.location;
    return {
        id: entity.id,
        ...(entity.zomatoRestaurantId && {
            zomatoRestaurantId: entity.zomatoRestaurantId,
        }),
        name: entity.name,
        cuisines: entity.cuisines,
        location: {
            address: entity.location.address,
            locality: entity.location.locality,
            city: entity.location.city,
            country: entity.location.country,
            ...(coordinates && {
                coordinates: {
                    longitude: coordinates.longitude,
                    latitude: coordinates.latitude,
                },
            }),
        },
        capabilities: {
            isDeliveringNow: entity.capabilities.isDeliveringNow,
            isTableBookingAvailable:
                entity.capabilities.isTableBookingAvailable,
            isOnlineDeliveryAvailable:
                entity.capabilities.isOnlineDeliveryAvailable,
            switchToOrderAhead: entity.capabilities.switchToOrderAhead,
        },
        pricing: {
            averageCostForTwo: entity.pricing.averageCostForTwo,
            currency: entity.pricing.currency,
            ...(entity.pricing.priceRange && {
                priceRange: entity.pricing.priceRange,
            }),
        },
        ratings: {
            ...(entity.ratings.averageRating !== undefined && {
                averageRating: entity.ratings.averageRating,
            }),
            totalVotes: entity.ratings.totalVotes,
            ...toRatingLabel(entity.ratings.averageRating),
        },
    };
}

// Request -> domain. Fields are copied explicitly so a new DTO field can't
// reach the domain without a deliberate change here.
export function toNewRestaurantEntity(
    dto: CreateRestaurantDto,
): NewRestaurantEntity {
    return {
        name: dto.name,
        cuisines: dto.cuisines,
        location: {
            address: dto.location.address,
            locality: dto.location.locality,
            city: dto.location.city,
            country: dto.location.country,
            coordinates: {
                longitude: dto.location.coordinates.longitude,
                latitude: dto.location.coordinates.latitude,
            },
        },
        capabilities: {
            isDeliveringNow: dto.capabilities.isDeliveringNow ?? false,
            isTableBookingAvailable:
                dto.capabilities.isTableBookingAvailable ?? false,
            isOnlineDeliveryAvailable:
                dto.capabilities.isOnlineDeliveryAvailable ?? false,
            switchToOrderAhead: dto.capabilities.switchToOrderAhead ?? false,
        },
        pricing: {
            averageCostForTwo: dto.pricing.averageCostForTwo,
            currency: dto.pricing.currency,
        },
        // A new restaurant has no votes and no rating yet.
        ratings: { totalVotes: 0 },
    };
}

// Listing result -> response row. Distance goes from metres to kilometres.
export function toRestaurantListItem({
    restaurant,
    distanceMeters,
}: RestaurantSearchResult): RestaurantListItemDto {
    return {
        id: restaurant.id,
        name: restaurant.name,
        address: restaurant.location.address,
        city: restaurant.location.city,
        country: restaurant.location.country,
        cuisines: restaurant.cuisines,
        averageCostForTwo: restaurant.pricing.averageCostForTwo,
        currency: restaurant.pricing.currency,
        ...(restaurant.ratings.averageRating !== undefined && {
            averageRating: restaurant.ratings.averageRating,
        }),
        ...toRatingLabel(restaurant.ratings.averageRating),
        ...(distanceMeters !== undefined && {
            distanceKm: Math.round(distanceMeters / 10) / 100,
        }),
    };
}

// Rating -> display label and colour, shared by every response.
export function toRatingLabel(averageRating?: number): {
    ratingText: string;
    ratingColor: string;
} {
    if (averageRating === undefined) {
        return { ratingText: NOT_RATED.text, ratingColor: NOT_RATED.color };
    }
    const band =
        RATING_BANDS.find((b) => averageRating >= b.min) ??
        RATING_BANDS[RATING_BANDS.length - 1];
    return { ratingText: band.text, ratingColor: band.color };
}
