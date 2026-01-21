import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  // Database schema location
  schema: './src/main/db/schema.ts',

  // Migration files output directory
  out: './drizzle',

  // Database driver
  dialect: 'sqlite',

  // Database connection
  dbCredentials: {
    url: './elly.db'
  },

  // Print all SQL statements
  verbose: true,

  // Always ask for confirmation before executing
  strict: true
})
