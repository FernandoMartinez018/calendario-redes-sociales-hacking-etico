import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://usergeneric:trcqlpn4xoReEj97X6UgstQyrNgbwem0@dpg-d81mjmd7vvec73a949gg-a.virginia-postgres.render.com/multiclassdatabase?sslmode=require',
  },
});
