import { parseSearchQuery } from './search-query.parser';

const vocabulary = {
    cities: ['Gurgaon', 'New Delhi', 'Delhi', 'Mumbai'],
    cuisines: [
        'South Indian',
        'North Indian',
        'Chinese',
        'Pizza',
        'Street Food',
    ],
};

describe('parseSearchQuery', () => {
    it.each([
        [
            'Best restaurants in Gurgaon with South Indian Food',
            { city: 'Gurgaon', cuisines: ['South Indian'], sortBy: 'rating' },
        ],
        [
            'Restaurants in Gurgaon under Rs. 1000 for two',
            { city: 'Gurgaon', maxCostForTwo: 1000 },
        ],
        [
            'Nearest place that serves Vada Pav',
            { sortBy: 'distance', name: 'vada pav' },
        ],
        ['pizza near me', { cuisines: ['Pizza'], sortBy: 'distance' }],
        [
            'cheap chinese in new delhi',
            { city: 'New Delhi', cuisines: ['Chinese'] },
        ],
        [
            'street food under ₹300',
            { cuisines: ['Street Food'], maxCostForTwo: 300 },
        ],
    ])('parses "%s"', (q, expected) => {
        expect(parseSearchQuery(q, vocabulary)).toEqual(expected);
    });

    it('prefers the longest matching city', () => {
        expect(parseSearchQuery('chinese in new delhi', vocabulary).city).toBe(
            'New Delhi',
        );
    });

    it('returns nothing for a query with no recognisable filters', () => {
        expect(parseSearchQuery('restaurants', vocabulary)).toEqual({});
    });
});
