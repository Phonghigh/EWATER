// Copy shared/config (static display config - map-style.json) into web/public.
// shared/data/* is NOT synced anymore: web/src/loadData.ts reads business
// data from Supabase directly (see tasks/BLOCKERS.md REAL-DATA-01 and
// tasks/PROGRESS.md P0-19) - shared/data/* stays only as the source the
// data-pipeline/import_*.py scripts seed Supabase from.
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shared = join(here, "..", "..", "shared");
const pub = join(here, "..", "public");

mkdirSync(join(pub, "config"), { recursive: true });
cpSync(join(shared, "config"), join(pub, "config"), { recursive: true });
console.log("Synced shared/config into web/public/");
