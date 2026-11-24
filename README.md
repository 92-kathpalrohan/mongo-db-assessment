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
