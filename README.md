# mongo-db-assessment

## Running locally

```bash
docker compose up -d --build
```

Starts three services:

- `mongodb`: MongoDB Atlas Local
- `seed`: imports `data/zomato.csv` once, then exits (re-runs are safe: rows
  are upserted on `zomatoRestaurantId`)
- `api`: the NestJS API on http://localhost:3000, started after the import
  finishes

API docs: http://localhost:3000/docs. Click **Authorize** and enter
`testing` (the demo `x-api-key` set in `docker-compose.yml`).

> Always pass `--build` after changing code. Without it, Compose reuses the
> existing image and runs the old code.

Check the import:

```bash
docker compose logs seed
```

## Testing

End-to-end tests run against the Docker MongoDB, in a separate
`mdb_assess_test` database that they create and drop themselves.

```bash
nvm use                         # Node 24.9+ (see .nvmrc)
docker compose up -d mongodb
npm run test:e2e
```

Node 24.9+ is required: Jest loads Nest 12's ESM-only packages through
`require(esm)`, which older Node versions don't support.
