import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsDefined,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

// Nested shapes shared by the restaurant request DTOs.

export class CoordinatesDto {
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;

    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;
}

export class LocationDto {
    @IsString() @IsNotEmpty() address: string;
    @IsString() @IsNotEmpty() locality: string;
    @IsString() @IsNotEmpty() city: string;
    @IsString() @IsNotEmpty() country: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => CoordinatesDto)
    coordinates: CoordinatesDto;
}

export class CapabilitiesDto {
    @IsBoolean() @IsOptional() isDeliveringNow?: boolean;
    @IsBoolean() @IsOptional() isTableBookingAvailable?: boolean;
    @IsBoolean() @IsOptional() isOnlineDeliveryAvailable?: boolean;
    @IsBoolean() @IsOptional() switchToOrderAhead?: boolean;
}

export class PricingDto {
    @IsNumber() @Min(0) averageCostForTwo: number;
    @IsString() @IsNotEmpty() currency: string;
}
