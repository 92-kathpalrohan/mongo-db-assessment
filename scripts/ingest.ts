import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import mongoose, { AnyBulkWriteOperation } from 'mongoose';
import { config } from '../src/common/config';
import { buildMongoUri } from '../src/common/utils';
import {
    Restaurant,
    RestaurantSchema,
} from '../src/databases/mongo/restaurants/restaurant.schema';
import { ensureRestaurantIndexes } from '../src/databases/mongo/restaurants/restaurant.indexes';

// Country names from Kaggle's Country-Code.xlsx; currencies are ISO 4217
// codes. The CSV's Currency column is ambiguous ("$" for five countries),
// garbled for the UK and wrong for the Philippines ("Botswana Pula").
const COUNTRY_BY_CODE: Record<string, { name: string; currency: string }> = {
    '1': { name: 'India', currency: 'INR' },
    '14': { name: 'Australia', currency: 'AUD' },
    '30': { name: 'Brazil', currency: 'BRL' },
    '37': { name: 'Canada', currency: 'CAD' },
    '94': { name: 'Indonesia', currency: 'IDR' },
    '148': { name: 'New Zealand', currency: 'NZD' },
    '162': { name: 'Philippines', currency: 'PHP' },
    '166': { name: 'Qatar', currency: 'QAR' },
    '184': { name: 'Singapore', currency: 'SGD' },
    '189': { name: 'South Africa', currency: 'ZAR' },
    '191': { name: 'Sri Lanka', currency: 'LKR' },
    '208': { name: 'Turkey', currency: 'TRY' },
    '214': { name: 'UAE', currency: 'AED' },
    '215': { name: 'United Kingdom', currency: 'GBP' },
    '216': { name: 'United States', currency: 'USD' },
};

const BATCH_SIZE = 1000;
const MAX_REPORTED_FAILURES = 5;

type CsvRow = Record<string, string>;

function toBoolean(value: string): boolean {
    return value.trim().toLowerCase() === 'yes';
}

function toRestaurant(row: CsvRow): Restaurant {
    const country = COUNTRY_BY_CODE[row['Country Code']];
    if (!country) {
        throw new Error(`Unknown country code "${row['Country Code']}"`);
    }

    const longitude = Number(row['Longitude']);
    const latitude = Number(row['Latitude']);
    const averageRating = Number(row['Aggregate rating']);

    return {
        zomatoRestaurantId: row['Restaurant ID'],
        name: row['Restaurant Name'],
        cuisines: row['Cuisines']
            .split(',')
            .map((cuisine) => cuisine.trim())
            .filter(Boolean) as [string],
        location: {
            address: row['Address'],
            locality: row['Locality'],
            city: row['City'],
            country: country.name,
            // 0 means "unknown" in this dataset: leave the point out rather
            // than store a fake location that $geoNear would rank.
            ...(longitude !== 0 && latitude !== 0
                ? {
                      coordinates: {
                          type: 'Point',
                          coordinates: [longitude, latitude],
                      },
                  }
                : {}),
        } as Restaurant['location'],
        capabilities: {
            isDeliveringNow: toBoolean(row['Is delivering now']),
            isTableBookingAvailable: toBoolean(row['Has Table booking']),
            isOnlineDeliveryAvailable: toBoolean(row['Has Online delivery']),
            switchToOrderAhead: toBoolean(row['Switch to order menu']),
        },
        pricing: {
            averageCostForTwo: Number(row['Average Cost for two']),
            currency: country.currency,
            priceRange: row['Price range'],
        },
        ratings: {
            // 0 means "not rated yet", not "rated zero".
            ...(averageRating !== 0 ? { averageRating } : {}),
            totalVotes: Number(row['Votes']),
        } as Restaurant['ratings'],
    };
}

async function main(): Promise<void> {
    const csvPath = process.argv[2];
    if (!csvPath) {
        throw new Error(
            'Usage: ts-node scripts/ingest.ts <path-to-zomato.csv>',
        );
    }

    await mongoose.connect(
        buildMongoUri(config.mongodb, { isLocal: config.isLocal }),
    );
    const RestaurantModel = mongoose.model(Restaurant.name, RestaurantSchema);

    await ensureRestaurantIndexes(RestaurantModel);

    let read = 0;
    let inserted = 0;
    let updated = 0;
    const failures: string[] = [];
    let batch: AnyBulkWriteOperation<Restaurant>[] = [];

    const flush = async (): Promise<void> => {
        if (batch.length === 0) return;
        const result = await RestaurantModel.bulkWrite(batch, {
            ordered: false,
        });
        inserted += result.upsertedCount;
        updated += result.modifiedCount;
        for (const error of result.mongoose?.validationErrors ?? []) {
            failures.push(error.message);
        }
        batch = [];
    };

    // Rows are parsed as the file is read, so memory stays flat no matter
    // how large the CSV is; writes go out every BATCH_SIZE rows.
    const parser = createReadStream(csvPath).pipe(
        parse({ columns: true, skip_empty_lines: true }),
    );
    for await (const row of parser as AsyncIterable<CsvRow>) {
        read += 1;
        try {
            const restaurant = toRestaurant(row);
            batch.push({
                replaceOne: {
                    filter: {
                        zomatoRestaurantId: restaurant.zomatoRestaurantId,
                    },
                    replacement: restaurant,
                    upsert: true,
                },
            });
        } catch (error) {
            failures.push(
                `Restaurant ID ${row['Restaurant ID']}: ${(error as Error).message}`,
            );
        }
        if (batch.length >= BATCH_SIZE) {
            await flush();
        }
    }
    await flush();

    console.log(
        `Read ${read} rows. Inserted ${inserted}, updated ${updated}, failed ${failures.length}`,
    );
    for (const failure of failures.slice(0, MAX_REPORTED_FAILURES)) {
        console.log(`  - ${failure}`);
    }

    await mongoose.disconnect();
    if (failures.length > 0) {
        process.exitCode = 1;
    }
}

main().catch(async (error: unknown) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
