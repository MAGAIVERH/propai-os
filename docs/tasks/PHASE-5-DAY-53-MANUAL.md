# Day 53 — Manual: Redis cache hit/miss + latency

## Prereqs

`REDIS_URL` set and the API running against the local Docker stack (see Day 49
manual). Have an active listing for your tenant.

## Steps

```bash
TENANT=<your org id>
# 1) First call — cache miss
curl -s -D - "http://localhost:3333/public/properties?tenantId=$TENANT" -o /dev/null | grep -i x-cache
#   X-Cache: MISS
# 2) Second identical call — cache hit
curl -s -D - "http://localhost:3333/public/properties?tenantId=$TENANT" -o /dev/null | grep -i x-cache
#   X-Cache: HIT
```

Measure before/after:
```bash
curl -s -o /dev/null -w "miss %{time_total}s\n" "http://localhost:3333/public/properties?tenantId=$TENANT"
curl -s -o /dev/null -w "hit  %{time_total}s\n" "http://localhost:3333/public/properties?tenantId=$TENANT"
```
The HIT response skips the DB round-trip (typically a few ms vs the query).

## Invalidation

Create / edit / delete a property for the tenant (authenticated `/v1/properties`
routes), then repeat call (1): it is a `MISS` again — the cached pages were
dropped. Inspect keys: `redis-cli KEYS 'public:properties:*'`.

## Notes

- TTL is 5 minutes; keys expire on their own even without an explicit
  invalidation.
- Cache layer is best-effort: if Redis is down, every request is a live query
  (no `X-Cache: HIT`), and the API keeps working.
