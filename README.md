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

## Git workflow (push to main)

Work on the local `main` branch and push to `main`. No feature branches.

1. **Get approval first.** Show the change (run it locally, share a screenshot or the diff) and wait for an explicit OK before committing.
2. Check what will be committed. Nothing secret (`.env`, keys) and no build output:
   ```bash
   git status
   ```
3. Commit, pull, push:
   ```bash
   git add .
   git commit -m "Describe what changed"
   git pull --rebase origin main   # get teammates' changes first; fix conflicts if any
   git push origin main
   ```
4. If `git pull --rebase` reports conflicts: fix the files, `git add .`, `git rebase --continue`, then push.

Run the client locally: `cd client && npm ci && npm run dev` → http://localhost:5173
