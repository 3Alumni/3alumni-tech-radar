# 3alumni-tech-radar

Monolith for the Powercoders market radar. Vue reads metrics. Nest writes them. A new data source is a config entry plus a connector folder.

```
client/     Vue app. One view per tab.
server/     Nest app. One folder per block, plus core for the snapshot.
config/     Sources, roles, topics, synonyms, agencies.
docs/       How the pieces fit and how to add a source.
```

Tabs: Demand, Skills, Employers, Context (people + policy), Sources.
Email reports reuse summaries already stored for a topic. They are not a separate pipeline.

## Database

Postgres runs in Docker. Schema changes live in `server/migrations` and are applied in order.

```
docker compose up -d
cd server && npm install && npm run migrate
```

Connection string: `postgres://radar:radar@localhost:5433/radar` (`DATABASE_URL` in `.env`). Port 5433 keeps this database off the Postgres that may already be running on 5432.
