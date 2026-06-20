---
name: homeup-listings-api
description: Query HomeUP public property listings in Singapore via JSON API (HDB, condo, landed).
---

# HomeUP Listings API

Use the public read-only API for active Singapore property listings operated by HomeUP.

## Base URL

`https://homeup.sg/api/public`

## Endpoints

- `GET /listings` — paginated active listings (filters: `listed_as`, `flat_type`, `min_price`, `max_price`, `page`)
- `GET /listings/{slug}` — single listing by slug

## OpenAPI

`https://homeup.sg/openapi.json`

## Authentication

No authentication required for public listing endpoints.

## HTML and markdown

- Listings page: `https://homeup.sg/listings`
- Request any public page with `Accept: text/markdown` for a markdown representation.
