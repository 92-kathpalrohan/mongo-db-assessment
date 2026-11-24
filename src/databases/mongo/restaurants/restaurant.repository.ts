import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, QueryFilter, Types } from 'mongoose';
import { escapeRegex } from '../../../common/utils';
import {
    NewRestaurantEntity,
    RestaurantEntity,
    RestaurantQuery,
    RestaurantSearchResult,
} from '../../../modules/restaurants/restaurant.entity';
import { MongoService } from '../mongo.service';
import { CASE_INSENSITIVE } from './restaurant.indexes';
import {
    RestaurantDocument,
    toEntity,
    toPersistence,
} from './restaurant.mapper';
import { Restaurant } from './restaurant.schema';

@Injectable()
export class RestaurantRepository {
    constructor(
        @InjectModel(Restaurant.name)
        private readonly model: Model<Restaurant>,
        private readonly mongoService: MongoService,
    ) {}

    async create(entity: NewRestaurantEntity): Promise<RestaurantEntity> {
        const doc = await this.mongoService.create({
            model: this.model,
            document: toPersistence(entity),
        });
        return toEntity(doc);
    }

    async findById(id: string): Promise<RestaurantEntity | null> {
        // A malformed id can't match anything: treat it as "not found".
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }
        const doc = await this.mongoService.findOne({
            model: this.model,
            filter: { _id: id },
        });
        return doc ? toEntity(doc) : null;
    }

    async list(query: RestaurantQuery): Promise<RestaurantSearchResult[]> {
        const filter = buildFilter(query);
        const sortOrder = query.order === 'asc' ? 1 : -1;

        const pipeline: PipelineStage[] = [
            buildFilterStage(query, filter),
            ...buildSort(query.sortBy, sortOrder),
            { $skip: query.offset },
            { $limit: query.limit },
        ];

        const docs = await this.mongoService.aggregate<
            RestaurantDocument & { distanceMeters?: number }
        >({ model: this.model, pipeline, collation: CASE_INSENSITIVE });

        return docs.map((doc) => ({
            restaurant: toEntity(doc),
            ...(doc.distanceMeters !== undefined && {
                distanceMeters: doc.distanceMeters,
            }),
        }));
    }
}

// With a location, $geoNear filters and adds each distance. It must be the
// first stage of the pipeline, so the filters go inside it.
function buildFilterStage(
    query: RestaurantQuery,
    filter: QueryFilter<Restaurant>,
): PipelineStage {
    if (!query.near) {
        return { $match: filter };
    }
    return {
        $geoNear: {
            near: {
                type: 'Point',
                coordinates: [query.near.longitude, query.near.latitude],
            },
            key: 'location.coordinates',
            distanceField: 'distanceMeters',
            spherical: true,
            query: filter,
        },
    };
}

function buildFilter(query: RestaurantQuery): QueryFilter<Restaurant> {
    const filter: Record<string, unknown> = {};
    if (query.name) {
        // "Contains" search, so it stays a regex: collation doesn't apply to
        // regexes (hence the i flag), and it can't use an index.
        filter.name = { $regex: escapeRegex(query.name), $options: 'i' };
    }
    // Plain equality: case-insensitive through CASE_INSENSITIVE, and able to
    // use the collation indexes from restaurant.indexes.ts.
    if (query.city) {
        filter['location.city'] = query.city;
    }
    if (query.country) {
        filter['location.country'] = query.country;
    }
    if (query.cuisines?.length) {
        filter.cuisines = { $in: query.cuisines };
    }
    if (query.minRating !== undefined) {
        // Unrated restaurants have no averageRating, so $gte drops them.
        filter['ratings.averageRating'] = { $gte: query.minRating };
    }
    if (query.maxCostForTwo !== undefined) {
        filter['pricing.averageCostForTwo'] = { $lte: query.maxCostForTwo };
    }
    return filter;
}

// Every sort ends with _id so ties have a stable order across pages.
function buildSort(
    sortBy: RestaurantQuery['sortBy'],
    sortOrder: 1 | -1,
): PipelineStage[] {
    switch (sortBy) {
        case 'rating':
            return [
                // Unrated restaurants go last in both directions.
                {
                    $addFields: {
                        hasRating: { $gt: ['$ratings.averageRating', null] },
                    },
                },
                {
                    $sort: {
                        hasRating: -1,
                        'ratings.averageRating': sortOrder,
                        'ratings.totalVotes': -1,
                        _id: 1,
                    },
                },
            ];
        case 'distance':
            return [{ $sort: { distanceMeters: sortOrder, _id: 1 } }];
        case 'name':
            return [{ $sort: { name: sortOrder, _id: 1 } }];
        case 'cost':
            return [
                {
                    $sort: {
                        'pricing.averageCostForTwo': sortOrder,
                        _id: 1,
                    },
                },
            ];
    }
}
