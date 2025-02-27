import type { Config } from 'drizzle-kit';

export default {
  schema: '../shared/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'sqlite.db'
  }
} satisfies Config;
