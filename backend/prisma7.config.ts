import "dotenv/config";
import { defineConfig,env } from "prisma/config";

const databaseurl=process.env.DATABASE_URL;

if(!databaseurl) {
  throw new Error("DATABASE_URL is missing from the backend .env file");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseurl,
  },
});
