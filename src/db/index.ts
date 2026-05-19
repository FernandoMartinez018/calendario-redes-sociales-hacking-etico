import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Pool } = pkg;

import * as schema from './schema.js';

// La app usa DATABASE_URL si existe; si no, cae a la misma URL que
// drizzle.config.ts. Así .env puede quedarse solo con Groq y la app igual conecta.
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://usergeneric:trcqlpn4xoReEj97X6UgstQyrNgbwem0@dpg-d81mjmd7vvec73a949gg-a.virginia-postgres.render.com/multiclassdatabase?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });
export default db;