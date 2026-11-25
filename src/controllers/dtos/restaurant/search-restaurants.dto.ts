import { IsNotEmpty, IsString } from 'class-validator';
import { ListRestaurantsDto } from './list-restaurants.dto';

// Everything the listing accepts, plus a natural-language query. Explicit
// parameters take precedence over what's understood from q.
export class SearchRestaurantsDto extends ListRestaurantsDto {
    /** e.g. "Best restaurants in Gurgaon with South Indian Food" */
    @IsString()
    @IsNotEmpty()
    q: string;
}
