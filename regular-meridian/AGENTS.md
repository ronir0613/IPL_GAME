## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Database Caution (D1 Database)

- **Do NOT use `DROP TABLE` in schema files**: [schema.sql](file:///d:/IPL_GAME/regular-meridian/schema.sql) must never contain drop statements, to avoid accidental wipes of the production database during updates.
- **Do NOT execute raw SQL initialization files on production**: Never run `npx wrangler d1 execute ipl-leaderboard --remote --file=schema.sql` against the live D1 database.
- **Use D1 Migrations**: Perform schema modifications incrementally using Cloudflare's migration system: `npx wrangler d1 migrations create ipl-leaderboard <migration_name>` instead of raw script execution.
