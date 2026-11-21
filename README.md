# 3alumni-tech-radar

Monolith for the Powercoders market radar. Vue reads metrics. Nest writes them. A new data source is a config entry plus a connector folder.

```
client/     Vue app. One view per tab.
server/     Nest app. Connectors, store, summaries.
config/     Sources, roles, topics, synonyms, agencies.
docs/       How the pieces fit and how to add a source.
```

Tabs: Demand, Skills, Employers, Context (people + policy), Sources.
Email reports reuse summaries already stored for a topic. They are not a separate pipeline.
