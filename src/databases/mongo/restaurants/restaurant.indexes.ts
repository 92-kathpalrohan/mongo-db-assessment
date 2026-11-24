import { Model } from 'mongoose';
import { Restaurant } from './restaurant.schema';

// Collation for case-insensitive equality. Queries must use this same
// collation to match case-insensitively and to use the indexes below.
export const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

const CASE_INSENSITIVE_FIELDS = [
    'cuisines',
    'location.city',
    'location.country',
];

// Every index the restaurants collection needs, in one place. Used by the
// ingestion script and the tests (the app runs with autoIndex off).
export async function ensureRestaurantIndexes(
    model: Model<Restaurant>,
): Promise<void> {
    // From the schema: partial unique index on zomatoRestaurantId.
    await model.createIndexes();
    await model.collection.createIndex({ 'location.coordinates': '2dsphere' });
    for (const field of CASE_INSENSITIVE_FIELDS) {
        await model.collection.createIndex(
            { [field]: 1 },
            { collation: CASE_INSENSITIVE },
        );
    }
}
