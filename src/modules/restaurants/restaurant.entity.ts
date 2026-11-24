// The domain's view of a restaurant: no transport or persistence details.
export interface RestaurantEntity {
    id: string;
    // Source reference; only restaurants imported from Zomato have one.
    zomatoRestaurantId?: string;
    name: string;
    cuisines: string[];
    location: {
        address: string;
        locality: string;
        city: string;
        country: string;
        // Absent when the source had no real coordinates.
        coordinates?: { longitude: number; latitude: number };
    };
    capabilities: {
        isDeliveringNow: boolean;
        isTableBookingAvailable: boolean;
        isOnlineDeliveryAvailable: boolean;
        switchToOrderAhead: boolean;
    };
    pricing: {
        averageCostForTwo: number;
        currency: string;
        priceRange?: string;
    };
    ratings: {
        // Absent means "not rated yet", not zero.
        averageRating?: number;
        totalVotes: number;
    };
}

export type NewRestaurantEntity = Omit<RestaurantEntity, 'id'>;

// What the listing asks for, independent of HTTP. Defaults are already
// applied, so sortBy and order are always set.
export interface RestaurantQuery {
    name?: string;
    city?: string;
    country?: string;
    cuisines?: string[];
    minRating?: number;
    maxCostForTwo?: number;
    near?: { longitude: number; latitude: number };
    sortBy: 'rating' | 'distance' | 'name' | 'cost';
    order: 'asc' | 'desc';
    limit: number;
    offset: number;
}

// One listing result: the restaurant plus its distance from the caller,
// when the query had a location.
export interface RestaurantSearchResult {
    restaurant: RestaurantEntity;
    distanceMeters?: number;
}
