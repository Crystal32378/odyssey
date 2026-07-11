# Odyssey Worklog

## Public launch blockers

- `PUBLIC_DEPLOY_BLOCKER: rate limiting required before public launch`
- `PUBLIC_DEPLOY_BLOCKER: Server must rebuild a strict allowlisted payload before sending requests to OpenAI. Do not forward the raw client body.`
- Add a request body size limit before public launch.

Before public deployment, the API boundary therefore requires all three controls: server-side allowlist payload reconstruction, request body size limiting, and rate limiting. These are deployment hardening tasks and do not block the fourteen-island MVP review.

## Scoring follow-up

- Journey stats have different theoretical maxima. Normalize them before any future comparative visualization.
- Raw scores are journey evidence, not objective personality measurements. Summary and Journey Card must remain a mirror grounded in quotes and named islands, never psychoanalysis.
