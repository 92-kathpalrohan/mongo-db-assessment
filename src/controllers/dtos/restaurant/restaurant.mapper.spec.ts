import type { ListRestaurantsDto } from './list-restaurants.dto';
import { toRatingLabel, toRestaurantQuery } from './restaurant.mapper';

describe('toRatingLabel', () => {
    it.each([
        [undefined, 'Not rated', 'White'],
        [1.8, 'Poor', 'Red'],
        [2.49, 'Poor', 'Red'],
        [2.5, 'Average', 'Orange'],
        [3.49, 'Average', 'Orange'],
        [3.5, 'Good', 'Yellow'],
        [3.99, 'Good', 'Yellow'],
        [4.0, 'Very Good', 'Green'],
        [4.49, 'Very Good', 'Green'],
        [4.5, 'Excellent', 'Dark Green'],
        [4.9, 'Excellent', 'Dark Green'],
    ])('maps %s to %s / %s', (rating, ratingText, ratingColor) => {
        expect(toRatingLabel(rating)).toEqual({ ratingText, ratingColor });
    });
});

describe('toRestaurantQuery', () => {
    // Plain objects: the mapper is tested on its own, without class-validator.
    const dto = (fields: Partial<ListRestaurantsDto>): ListRestaurantsDto => ({
        limit: 20,
        offset: 0,
        ...fields,
    });

    it('defaults to rating, highest first', () => {
        expect(toRestaurantQuery(dto({}))).toMatchObject({
            sortBy: 'rating',
            order: 'desc',
        });
    });

    it.each(['distance', 'name', 'cost'] as const)(
        'defaults %s to ascending',
        (sortBy) => {
            expect(
                toRestaurantQuery(dto({ sortBy, lat: 28.4, lng: 77 })).order,
            ).toBe('asc');
        },
    );

    it('keeps an explicit order', () => {
        expect(
            toRestaurantQuery(dto({ sortBy: 'rating', order: 'asc' })).order,
        ).toBe('asc');
    });

    it('sets near only when both lat and lng are given', () => {
        expect(toRestaurantQuery(dto({ lat: 28.4, lng: 77 })).near).toEqual({
            longitude: 77,
            latitude: 28.4,
        });
        expect(toRestaurantQuery(dto({ lat: 28.4 })).near).toBeUndefined();
    });
});
