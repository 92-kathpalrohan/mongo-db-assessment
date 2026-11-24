import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { createApp } from '../src/app';
import { ensureRestaurantIndexes } from '../src/databases/mongo/restaurants/restaurant.indexes';
import { Restaurant } from '../src/databases/mongo/restaurants/restaurant.schema';

// Runs against the Docker MongoDB (docker compose up -d mongodb), in the
// mdb_assess_test database set by setEnvVars.ts.

const API_KEY = 'test-key';
// Central Gurgaon: the caller's position in distance tests.
const HERE = { lat: 28.4595, lng: 77.0266 };

function fixture(
    name: string,
    {
        city,
        cuisines,
        rating,
        votes,
        cost,
        lngLat,
    }: {
        city: string;
        cuisines: string[];
        rating?: number;
        votes: number;
        cost: number;
        lngLat?: [number, number];
    },
): Restaurant {
    return {
        name,
        cuisines,
        location: {
            address: `1 Test Road, ${city}`,
            locality: 'Test Locality',
            city,
            country: 'India',
            ...(lngLat && {
                coordinates: { type: 'Point', coordinates: lngLat },
            }),
        },
        capabilities: {
            isDeliveringNow: false,
            isTableBookingAvailable: false,
            isOnlineDeliveryAvailable: true,
            switchToOrderAhead: false,
        },
        pricing: { averageCostForTwo: cost, currency: 'INR' },
        ratings: {
            ...(rating !== undefined && { averageRating: rating }),
            totalVotes: votes,
        },
    };
}

// Chosen to hit the edge cases: one unrated, one without coordinates,
// two cities, mixed cuisines and costs.
const FIXTURES: Restaurant[] = [
    fixture('Alpha Dosa', {
        city: 'Gurgaon',
        cuisines: ['South Indian'],
        rating: 4.5,
        votes: 500,
        cost: 500,
        lngLat: [77.03, 28.46],
    }),
    fixture('Bravo Biryani', {
        city: 'Gurgaon',
        cuisines: ['North Indian', 'Biryani'],
        rating: 3.8,
        votes: 200,
        cost: 800,
        lngLat: [77.1, 28.5],
    }),
    fixture('Charlie Chaat', {
        city: 'Gurgaon',
        cuisines: ['Street Food'],
        votes: 2,
        cost: 200,
        lngLat: [77.05, 28.47],
    }),
    fixture('Delta Diner', {
        city: 'Gurgaon',
        cuisines: ['North Indian'],
        rating: 4.0,
        votes: 100,
        cost: 1500,
    }),
    fixture('Echo Cafe', {
        city: 'New Delhi',
        cuisines: ['Cafe'],
        rating: 4.9,
        votes: 1000,
        cost: 600,
        lngLat: [77.21, 28.61],
    }),
    fixture('Foxtrot Grill', {
        city: 'New Delhi',
        cuisines: ['Chinese'],
        rating: 2.1,
        votes: 50,
        cost: 900,
        lngLat: [77.22, 28.63],
    }),
];

const NEW_RESTAURANT = {
    name: 'Test Dosa Corner',
    cuisines: ['South Indian'],
    location: {
        address: '12 MG Road',
        locality: 'MG Road',
        city: 'Gurgaon',
        country: 'India',
        coordinates: { longitude: 77.08, latitude: 28.47 },
    },
    capabilities: {},
    pricing: { averageCostForTwo: 600, currency: 'INR' },
};

type ListItem = { name: string; distanceKm?: number };

describe('Restaurants API (e2e)', () => {
    let app: INestApplication<App>;
    let model: Model<Restaurant>;

    const api = () => request(app.getHttpServer());
    const list = async (query: string): Promise<ListItem[]> => {
        const res = await api()
            .get(`/v1/restaurants?${query}`)
            .set('x-api-key', API_KEY)
            .expect(200);
        return (res.body as { items: ListItem[] }).items;
    };
    const names = (items: ListItem[]) => items.map((item) => item.name);

    beforeAll(async () => {
        app = (await createApp()) as INestApplication<App>;
        await app.init();
        model = app.get<Model<Restaurant>>(getModelToken(Restaurant.name), {
            strict: false,
        });
        await model.db.dropDatabase();
        await ensureRestaurantIndexes(model);
        await model.insertMany(FIXTURES);
    });

    afterAll(async () => {
        await model.db.dropDatabase();
        await app.close();
    });

    describe('auth', () => {
        it('rejects restaurant routes without x-api-key', async () => {
            await api().get('/v1/restaurants').expect(401);
        });

        it('keeps the health check open', async () => {
            await api().get('/hc').expect(200);
        });
    });

    describe('POST /v1/restaurants', () => {
        it('creates a restaurant with server-side defaults', async () => {
            const res = await api()
                .post('/v1/restaurants')
                .set('x-api-key', API_KEY)
                .send(NEW_RESTAURANT)
                .expect(201);

            expect(res.body).toMatchObject({
                id: expect.any(String),
                name: 'Test Dosa Corner',
                location: {
                    coordinates: { longitude: 77.08, latitude: 28.47 },
                },
                capabilities: {
                    isDeliveringNow: false,
                    isTableBookingAvailable: false,
                    isOnlineDeliveryAvailable: false,
                    switchToOrderAhead: false,
                },
                ratings: {
                    totalVotes: 0,
                    ratingText: 'Not rated',
                    ratingColor: 'White',
                },
            });
            expect(res.body.ratings.averageRating).toBeUndefined();
            await model.deleteOne({ name: 'Test Dosa Corner' });
        });

        it('rejects a body without coordinates', async () => {
            const { coordinates: _omitted, ...location } =
                NEW_RESTAURANT.location;
            await api()
                .post('/v1/restaurants')
                .set('x-api-key', API_KEY)
                .send({ ...NEW_RESTAURANT, location })
                .expect(400);
        });
    });

    describe('GET /v1/restaurants/:id', () => {
        it('returns full details for an existing restaurant', async () => {
            const alpha = await model.findOne({ name: 'Alpha Dosa' }).lean();
            const res = await api()
                .get(`/v1/restaurants/${alpha!._id.toHexString()}`)
                .set('x-api-key', API_KEY)
                .expect(200);
            expect(res.body).toMatchObject({
                name: 'Alpha Dosa',
                ratings: { averageRating: 4.5, ratingText: 'Excellent' },
            });
        });

        it('returns 404 for an unknown id', async () => {
            await api()
                .get('/v1/restaurants/000000000000000000000000')
                .set('x-api-key', API_KEY)
                .expect(404);
        });

        it('returns 404 for a malformed id', async () => {
            await api()
                .get('/v1/restaurants/not-an-id')
                .set('x-api-key', API_KEY)
                .expect(404);
        });
    });

    describe('GET /v1/restaurants: sorting', () => {
        it('defaults to rating, highest first, unrated last', async () => {
            expect(names(await list(''))).toEqual([
                'Echo Cafe',
                'Alpha Dosa',
                'Delta Diner',
                'Bravo Biryani',
                'Foxtrot Grill',
                'Charlie Chaat',
            ]);
        });

        it('keeps unrated last when sorting ascending', async () => {
            const result = names(await list('sortBy=rating&order=asc'));
            expect(result[0]).toBe('Foxtrot Grill');
            expect(result.at(-1)).toBe('Charlie Chaat');
        });
    });

    describe('GET /v1/restaurants: filters', () => {
        it('matches city case-insensitively', async () => {
            expect(names(await list('city=gurgaon')).sort()).toEqual([
                'Alpha Dosa',
                'Bravo Biryani',
                'Charlie Chaat',
                'Delta Diner',
            ]);
        });

        it('matches any of the cuisines, case-insensitively', async () => {
            expect(
                names(await list('cuisines=north indian,CHINESE')).sort(),
            ).toEqual(['Bravo Biryani', 'Delta Diner', 'Foxtrot Grill']);
        });

        it('drops unrated restaurants when minRating is set', async () => {
            expect(names(await list('minRating=4')).sort()).toEqual([
                'Alpha Dosa',
                'Delta Diner',
                'Echo Cafe',
            ]);
        });

        it('filters by maximum cost for two', async () => {
            expect(
                names(await list('city=Gurgaon&maxCostForTwo=600')).sort(),
            ).toEqual(['Alpha Dosa', 'Charlie Chaat']);
        });
    });

    describe('GET /v1/restaurants: distance', () => {
        it('sorts nearest first and skips restaurants without coordinates', async () => {
            const items = await list(
                `lat=${HERE.lat}&lng=${HERE.lng}&sortBy=distance`,
            );
            expect(names(items)).toEqual([
                'Alpha Dosa',
                'Charlie Chaat',
                'Bravo Biryani',
                'Echo Cafe',
                'Foxtrot Grill',
            ]);
            expect(
                items.every((item) => typeof item.distanceKm === 'number'),
            ).toBe(true);
        });

        it('requires lat and lng for distance sorting', async () => {
            await api()
                .get('/v1/restaurants?sortBy=distance')
                .set('x-api-key', API_KEY)
                .expect(400);
        });
    });

    describe('GET /v1/restaurants: pagination', () => {
        it('returns non-overlapping pages', async () => {
            const first = names(await list('limit=3&offset=0'));
            const second = names(await list('limit=3&offset=3'));
            expect(first).toHaveLength(3);
            expect(second).toHaveLength(3);
            expect(first.filter((name) => second.includes(name))).toEqual([]);
        });
    });
});
