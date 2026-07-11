# Next.js template

This is a Next.js template with shadcn/ui.

## Prisma

The project is configured to use Prisma 7 with PostgreSQL and the `@prisma/adapter-pg` driver adapter.

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string.
2. Generate the Prisma Client with `pnpm db:generate`.
3. Create the database tables with `pnpm db:migrate --name init`.
4. Load the 10 participant rosters with `pnpm db:seed`.

The generated client is written to `app/generated/prisma` and is ignored by Git. Import the shared client from `@/lib/prisma` in server-side code only.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
