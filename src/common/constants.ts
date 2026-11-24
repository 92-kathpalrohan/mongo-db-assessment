// Rating labels, derived at response time instead of stored. Thresholds are
// the ones observed in the Zomato data; checked from the highest band down.
export const RATING_BANDS = [
    { min: 4.5, text: 'Excellent', color: 'Dark Green' },
    { min: 4.0, text: 'Very Good', color: 'Green' },
    { min: 3.5, text: 'Good', color: 'Yellow' },
    { min: 2.5, text: 'Average', color: 'Orange' },
    { min: 0, text: 'Poor', color: 'Red' },
] as const;

export const NOT_RATED = { text: 'Not rated', color: 'White' } as const;
