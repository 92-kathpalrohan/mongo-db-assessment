import { escapeRegex } from '../../common/utils';
import { RestaurantQuery } from './restaurant.entity';

// Filters understood from a natural-language query. Only what was found is set.
export type ParsedSearch = Pick<
    Partial<RestaurantQuery>,
    'city' | 'cuisines' | 'maxCostForTwo' | 'sortBy' | 'name'
>;

// Words that carry no search meaning once filters are extracted.
const FILLER_WORDS = new Set([
    'a',
    'an',
    'the',
    'in',
    'at',
    'with',
    'for',
    'two',
    'of',
    'that',
    'which',
    'serves',
    'serve',
    'serving',
    'restaurant',
    'restaurants',
    'place',
    'places',
    'food',
    'me',
    'near',
    'nearest',
    'closest',
    'best',
    'top',
    'highest',
    'rated',
    'good',
    'cheap',
    'some',
    'any',
    'show',
    'find',
]);

const BUDGET =
    /\b(?:under|below|less than|within|cheapest|cheap)\s*(?:rs\.?|inr|₹)?\s*(\d+)/;
const BY_RATING = /\b(?:best|top|highest rated|gourmet)\b/;
const BY_DISTANCE = /\b(?:nearest|near me|closest|nearby)\b/;

// Deterministic, vocabulary-based parsing: known cities and cuisines come
// from the data, so they're matched exactly; leftover words become a name
// search (e.g. a dish that appears in restaurant names, like "vada pav").
export function parseSearchQuery(
    q: string,
    { cities, cuisines }: { cities: string[]; cuisines: string[] },
): ParsedSearch {
    let text = ` ${q.toLowerCase()} `;
    const parsed: ParsedSearch = {};

    const city = findPhrases(text, cities)[0];
    if (city) {
        parsed.city = city;
        text = removePhrase(text, city);
    }

    const foundCuisines = findPhrases(text, cuisines);
    for (const cuisine of foundCuisines) {
        text = removePhrase(text, cuisine);
    }
    if (foundCuisines.length) {
        parsed.cuisines = foundCuisines;
    }

    const budget = BUDGET.exec(text);
    if (budget) {
        parsed.maxCostForTwo = Number(budget[1]);
        text = text.replace(budget[0], ' ');
    }

    if (BY_DISTANCE.test(text)) {
        parsed.sortBy = 'distance';
    } else if (BY_RATING.test(text)) {
        parsed.sortBy = 'rating';
    }

    const leftover = text
        .split(/[^a-z0-9']+/)
        .filter((word) => word && !FILLER_WORDS.has(word));
    if (leftover.length) {
        parsed.name = leftover.join(' ');
    }

    return parsed;
}

// Known phrases present in the text as whole words, longest first, so
// "New Delhi" wins over "Delhi" and "South Indian" over "Indian".
function findPhrases(text: string, phrases: string[]): string[] {
    const found: string[] = [];
    let remaining = text;
    for (const phrase of [...phrases].sort((a, b) => b.length - a.length)) {
        if (phraseRegex(phrase).test(remaining)) {
            found.push(phrase);
            remaining = removePhrase(remaining, phrase);
        }
    }
    return found;
}

function removePhrase(text: string, phrase: string): string {
    return text.replace(phraseRegex(phrase), ' ');
}

function phraseRegex(phrase: string): RegExp {
    return new RegExp(`\\b${escapeRegex(phrase.toLowerCase())}\\b`);
}
