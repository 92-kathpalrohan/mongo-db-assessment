import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsDefined,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from 'class-validator';
import { CapabilitiesDto, LocationDto, PricingDto } from './restaurant.dto';

export class CreateRestaurantDto {
    @IsString() @IsNotEmpty() name: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    cuisines: string[];

    @IsDefined()
    @ValidateNested()
    @Type(() => LocationDto)
    location: LocationDto;

    @IsDefined()
    @ValidateNested()
    @Type(() => CapabilitiesDto)
    capabilities: CapabilitiesDto;

    @IsDefined()
    @ValidateNested()
    @Type(() => PricingDto)
    pricing: PricingDto;
}
