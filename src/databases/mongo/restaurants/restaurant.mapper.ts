import { Types } from 'mongoose';
import {
    NewRestaurantEntity,
    RestaurantEntity,
} from '../../../modules/restaurants/restaurant.entity';
import { Restaurant } from './restaurant.schema';

export type RestaurantDocument = Restaurant & { _id: Types.ObjectId };

// Domain -> MongoDB. Coordinates become a GeoJSON Point ([longitude, latitude])
// so the 2dsphere index and $geoNear can use them.
export function toPersistence(entity: NewRestaurantEntity): Restaurant {
    const { coordinates, ...location } = entity.location;
    return {
        zomatoRestaurantId: entity.zomatoRestaurantId,
        name: entity.name,
        cuisines: entity.cuisines,
        location: {
            ...location,
            ...(coordinates && {
                coordinates: {
                    type: 'Point',
                    coordinates: [coordinates.longitude, coordinates.latitude],
                },
            }),
        },
        capabilities: { ...entity.capabilities },
        pricing: { ...entity.pricing },
        ratings: { ...entity.ratings },
    };
}

// MongoDB -> domain. Drops storage-only fields (_id, __v, timestamps).
export function toEntity(doc: RestaurantDocument): RestaurantEntity {
    const { coordinates, address, locality, city, country } = doc.location;
    return {
        id: doc._id.toHexString(),
        zomatoRestaurantId: doc.zomatoRestaurantId,
        name: doc.name,
        cuisines: doc.cuisines,
        location: {
            address,
            locality,
            city,
            country,
            ...(coordinates && {
                coordinates: {
                    longitude: coordinates.coordinates[0],
                    latitude: coordinates.coordinates[1],
                },
            }),
        },
        capabilities: {
            isDeliveringNow: doc.capabilities.isDeliveringNow,
            isTableBookingAvailable: doc.capabilities.isTableBookingAvailable,
            isOnlineDeliveryAvailable:
                doc.capabilities.isOnlineDeliveryAvailable,
            switchToOrderAhead: doc.capabilities.switchToOrderAhead,
        },
        pricing: {
            averageCostForTwo: doc.pricing.averageCostForTwo,
            currency: doc.pricing.currency,
            priceRange: doc.pricing.priceRange,
        },
        ratings: {
            averageRating: doc.ratings.averageRating,
            totalVotes: doc.ratings.totalVotes,
        },
    };
}
