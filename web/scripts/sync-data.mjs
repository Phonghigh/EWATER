// Copy shared data + config into web/public so the app can fetch them.
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shared = join(here, "..", "..", "shared");
const pub = join(here, "..", "public");

mkdirSync(join(pub, "data"), { recursive: true });
mkdirSync(join(pub, "config"), { recursive: true });
cpSync(join(shared, "data"), join(pub, "data"), { recursive: true });
cpSync(join(shared, "config"), join(pub, "config"), { recursive: true });
console.log("Synced shared/data and shared/config into web/public/");
