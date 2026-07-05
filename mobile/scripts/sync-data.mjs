// Copy shared data + config into mobile/assets/data as .json (Metro-importable).
import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const shared = join(here, "..", "..", "shared");
const out = join(here, "..", "assets", "data");
mkdirSync(out, { recursive: true });

for (const f of readdirSync(join(shared, "data"))) {
  copyFileSync(join(shared, "data", f), join(out, f.replace(/\.geojson$/, ".json")));
}
copyFileSync(join(shared, "config", "map-style.json"), join(out, "map-style.json"));
console.log("Synced shared data into mobile/assets/data/");
