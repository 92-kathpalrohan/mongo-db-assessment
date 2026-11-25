# Restaurant Discovery API

MVP of the customer-facing restaurant discovery backend for BiteExpress, built
with NestJS and MongoDB on the Zomato restaurants dataset.

## Quick start

```bash
docker compose up -d --build
```

| Service   | What it does                                                                                          |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `mongodb` | MongoDB Atlas Local (Atlas Search and Vector Search available locally)                                |
| `seed`    | Imports `data/zomato.csv` once, then exits. Safe to re-run: rows are upserted on `zomatoRestaurantId` |
| `api`     | The API on http://localhost:3000, started after the import finishes                                   |

Open http://localhost:3000/docs, click **Authorize** and enter `testing` (the
demo `x-api-key` from `docker-compose.yml`).

> Always pass `--build` after changing code, otherwise Compose reuses the old
> image.

Check the import: `docker compose logs seed`.

The database isn't persisted: whenever the containers are recreated, MongoDB
starts fresh and the seed re-imports the data, so restaurants created through
`POST` don't survive a recreate.

## Endpoints

All `/v1/restaurants` routes require the `x-api-key` header. `/hc` is open.

| Method | Path                     | Description                                    |
| ------ | ------------------------ | ---------------------------------------------- |
| `POST` | `/v1/restaurants`        | Create a restaurant; returns the full record   |
| `GET`  | `/v1/restaurants/{id}`   | Full details; 404 for unknown or malformed ids |
| `GET`  | `/v1/restaurants`        | Listing with filters, sorting and pagination   |
| `GET`  | `/v1/restaurants/search` | Natural-language search (see below)            |

Listing parameters: `name` (contains), `city`, `country`, `cuisines`
(comma-separated, any of), `minRating`, `maxCostForTwo`, `lat` + `lng`,
`sortBy` (`rating` | `distance` | `name` | `cost`), `order`, `limit` (max
100), `offset`. Default sort: rating, highest first, unrated last. `city`,
`country` and `cuisines` match case-insensitively.

```bash
curl -H 'x-api-key: testing' \
  'http://localhost:3000/v1/restaurants?name=vada%20pav&lat=28.4595&lng=77.0266&sortBy=distance'
```

Each listing item has the fields the brief asks for (id, name, address, city,
country, cuisines, average rating, distance in km when `lat`/`lng` are sent),
plus cost for two with its currency and a rating label and colour.

## Natural-language search

`GET /v1/restaurants/search?q=...` accepts a sentence plus any listing
parameter (`lat`/`lng`, `limit`, ...). The query is parsed into the listing's
filters and runs through the same query path as `GET /v1/restaurants`.

```bash
curl -G -H 'x-api-key: testing' 'http://localhost:3000/v1/restaurants/search' \
  --data-urlencode 'q=Nearest place that serves Vada Pav' \
  --data-urlencode 'lat=28.4595' --data-urlencode 'lng=77.0266'
```

The parser is deterministic and vocabulary-based:

- Known cities and cuisines are loaded from the data (`distinct`, cached) and
  matched as whole phrases, longest first ("New Delhi" before "Delhi").
- "under Rs. 1000" / "below ₹500" becomes `maxCostForTwo`; "best" / "top"
  sorts by rating; "nearest" / "near me" sorts by distance (only when
  `lat`/`lng` are sent).
- Remaining words, minus filler words, become a name search, so dishes that
  appear in restaurant names work ("Vada Pav").
- Explicit query parameters take precedence over parsed ones.

Limits: open-ended phrasing ("somewhere cosy") and dishes that never appear in
restaurant names (the dataset has no menus) aren't understood. Upgrade path:
an LLM with structured output mapping `q` to the same filters (validated by
the same DTO rules, with this parser as the fallback), Atlas Search for
typo-tolerant, relevance-ranked text, and Vector Search for meaning-based
matching. All of these are available in the Atlas Local image.

## Architecture

```
controllers/  HTTP: DTOs, validation, request/response mappers
modules/      domain: RestaurantEntity, RestaurantsService (no HTTP, no Mongoose)
databases/    persistence: schema, repository, MongoService, entity <-> document mapper
```

- Each boundary has its own type and mapper, so API changes and storage
  changes don't leak into each other.
- `MongoModule` exports only repositories: nothing outside it can reach a
  Mongoose model directly.
- Mongoose schema validation runs on every write, including the ingestion
  script, which uses the same model.

## Data model and cleanup

One `restaurants` collection. Decisions made while importing the CSV:

| Source issue                                                                                      | Decision                                                                               |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 499 rows with longitude or latitude of 0                                                          | `location.coordinates` omitted: unknown, not a point in the ocean                      |
| Rating 0 means "Not rated" (2,148 rows)                                                           | `averageRating` omitted, so `$avg` and filters stay correct                            |
| Rating text and colour columns                                                                    | Not stored; derived from the rating at response time (matches the source for all rows) |
| `Locality Verbose` is locality + city                                                             | Dropped                                                                                |
| Country only as a numeric code                                                                    | Name from Kaggle's country-code table                                                  |
| Currency column ambiguous (`$` for five countries), garbled for the UK, wrong for the Philippines | ISO 4217 code derived from the country                                                 |
| Zomato's `Restaurant ID`                                                                          | Kept as `zomatoRestaurantId` (source reference); the public id is MongoDB's `_id`      |
| 246 rows with garbled characters in the source file                                               | Imported as is                                                                         |

Indexes (created by the ingestion script and the tests, from
`restaurant.indexes.ts`): 2dsphere on `location.coordinates`, case-insensitive
collation indexes on `cuisines`, `location.city` and `location.country`, and a
partial unique index on `zomatoRestaurantId`.

## Known trade-offs

- Sending `lat`/`lng` uses `$geoNear`, which only returns restaurants with
  coordinates.
- Cost compares raw amounts; combine cost filters and sorting with `city` or
  `country`.
- `name` is a case-insensitive "contains" regex and can't use an index.
- `limit`/`offset` pagination; a cursor would scale better for deep pages.

## Testing

Unit tests (no database needed):

```bash
npm test
```

End-to-end tests run against the Docker MongoDB, in a separate
`mdb_assess_test` database that they create and drop themselves.

```bash
nvm use                         # Node 24.9+ (see .nvmrc)
docker compose up -d mongodb
npm run test:e2e
```

Node 24.9+ is required: Jest loads Nest 12's ESM-only packages through
`require(esm)`, which older Node versions don't support.

## Tools and AI disclosure

Built with the assistance of Claude Code (Anthropic) for guidance, code
generation and review. All design decisions were discussed and made by me.
