import { Transform, Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsDefined,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateIf,
} from 'class-validator';

export const SORT_FIELDS = ['rating', 'distance', 'name', 'cost'] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

// The only cross-field rule: distance needs the caller's position.
const usesDistance = (q: ListRestaurantsDto) =>
    q.sortBy === 'distance' || q.lat !== undefined || q.lng !== undefined;

export class ListRestaurantsDto {
    /** Partial, case-insensitive match on the restaurant name. */
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    city?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    country?: string;

    /** Comma-separated; matches restaurants serving any of them. */
    @IsOptional()
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string'
            ? value
                  .split(',')
                  .map((c) => c.trim())
                  .filter(Boolean)
            : value,
    )
    @ArrayNotEmpty()
    @IsString({ each: true })
    cuisines?: string[];

    /** Unrated restaurants are excluded when set. */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(5)
    minRating?: number;

    /**
     * Raw amount in each restaurant's own currency: combine with city or
     * country so all results share one currency.
     */
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxCostForTwo?: number;

    /** User latitude; required with lng for distance. */
    @ValidateIf(usesDistance)
    @IsDefined({ message: 'lat and lng are required for distance' })
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat?: number;

    /** User longitude; required with lat for distance. */
    @ValidateIf(usesDistance)
    @IsDefined({ message: 'lat and lng are required for distance' })
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    lng?: number;

    /**
     * Default: rating, highest first (unrated last). distance needs lat/lng;
     * cost compares raw amounts, so combine it with city or country.
     */
    @IsOptional()
    @IsIn(SORT_FIELDS)
    sortBy?: (typeof SORT_FIELDS)[number];

    @IsOptional()
    @IsIn(SORT_ORDERS)
    order?: (typeof SORT_ORDERS)[number];

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset: number = 0;
}
