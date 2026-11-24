// Full restaurant details returned by POST and GET /v1/restaurants/{id}.
// Plain classes (not interfaces) so Swagger can document them.

export class CoordinatesResponseDto {
    longitude: number;
    latitude: number;
}

export class LocationResponseDto {
    address: string;
    locality: string;
    city: string;
    country: string;
    /** Absent when the source data had no real coordinates. */
    coordinates?: CoordinatesResponseDto;
}

export class CapabilitiesResponseDto {
    isDeliveringNow: boolean;
    isTableBookingAvailable: boolean;
    isOnlineDeliveryAvailable: boolean;
    switchToOrderAhead: boolean;
}

export class PricingResponseDto {
    averageCostForTwo: number;
    currency: string;
    /** Price tier 1-4, when known. */
    priceRange?: string;
}

export class RatingsResponseDto {
    /** Absent means not rated yet. */
    averageRating?: number;
    totalVotes: number;
    /** Label for averageRating, e.g. "Very Good"; "Not rated" when unrated. */
    ratingText: string;
    /** Display colour for the label, e.g. "Green". */
    ratingColor: string;
}

export class RestaurantResponseDto {
    id: string;
    /** Present only for restaurants imported from the Zomato dataset. */
    zomatoRestaurantId?: string;
    name: string;
    cuisines: string[];
    location: LocationResponseDto;
    capabilities: CapabilitiesResponseDto;
    pricing: PricingResponseDto;
    ratings: RatingsResponseDto;
}

// One row of GET /v1/restaurants: the fields a listing needs, flattened.
export class RestaurantListItemDto {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    cuisines: string[];
    averageCostForTwo: number;
    /** Currency of averageCostForTwo, as given by the source. */
    currency: string;
    /** Absent means not rated yet. */
    averageRating?: number;
    /** Label for averageRating, e.g. "Very Good"; "Not rated" when unrated. */
    ratingText: string;
    /** Display colour for the label, e.g. "Green". */
    ratingColor: string;
    /** Kilometres from lat/lng, rounded to 2 decimals; only when a location was sent. */
    distanceKm?: number;
}

export class RestaurantListResponseDto {
    items: RestaurantListItemDto[];
    limit: number;
    offset: number;
}
