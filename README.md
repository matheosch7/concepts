# concepts

Concept drafts (quick MVPs) that Matt builds for specific freelance proposals. Published by the gig-hunter pipeline only after Matt approves a proposal.

## Structure (one folder = one job, never shared)

```
c/<jobId>-<random8>/index.html   ← the concept for exactly one job
c/<jobId>-<random8>/…            ← its own assets only (no shared assets between jobs)
```

- `jobId` = platform prefix + job id (e.g. `up-2102475228763325990` for Upwork).
- `random8` makes the URL unguessable, so clients can't browse to each other's drafts.
- Every page carries `<meta name="concept-job" content="<jobId>">`; the publish script refuses to overwrite a folder stamped with a different job and verifies the live URL serves the right job after deploy.
- No index of concepts exists anywhere in this repo, robots.txt disallows crawling, and every page is `noindex`.
- The job → folder map lives only in Matt's private `~/Projects/gig-hunter/state/public-map.json`.
- To retire a concept: delete its folder (`scripts/publish_concept.sh --remove <jobId>`).
