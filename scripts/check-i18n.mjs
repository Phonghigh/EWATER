#!/usr/bin/env node
// Checks that web/src/i18n/strings.ts has the same set of keys in its "vi"
// and "en" blocks. Missing keys silently fall back at runtime (vi -> en ->
// raw key), so this is the only signal that a translation was forgotten.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const stringsPath = path.join(repoRoot, "web", "src", "i18n", "strings.ts");

function extractBlock(source, lang) {
  const start = source.indexOf(`  ${lang}: {`);
  if (start === -1) throw new Error(`Could not find "${lang}:" block in ${stringsPath}`);
  const bodyStart = source.indexOf("{", start) + 1;
  let depth = 1;
  let i = bodyStart;
  while (depth > 0 && i < source.length) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
    i++;
  }
  return source.slice(bodyStart, i - 1);
}

function extractKeys(block) {
  const keys = new Set();
  const re = /^\s*"([^"]+)":\s*"/gm;
  let m;
  while ((m = re.exec(block))) keys.add(m[1]);
  return keys;
}

const source = readFileSync(stringsPath, "utf8");
const viKeys = extractKeys(extractBlock(source, "vi"));
const enKeys = extractKeys(extractBlock(source, "en"));

const missingInEn = [...viKeys].filter((k) => !enKeys.has(k)).sort();
const missingInVi = [...enKeys].filter((k) => !viKeys.has(k)).sort();

if (missingInEn.length === 0 && missingInVi.length === 0) {
  console.log(`i18n check OK - ${viKeys.size} keys, vi/en in sync.`);
  process.exit(0);
}

console.warn("i18n key mismatch in web/src/i18n/strings.ts:");
if (missingInEn.length > 0) {
  console.warn(`  Present in "vi" but missing in "en" (${missingInEn.length}):`);
  for (const k of missingInEn) console.warn(`    - ${k}`);
}
if (missingInVi.length > 0) {
  console.warn(`  Present in "en" but missing in "vi" (${missingInVi.length}):`);
  for (const k of missingInVi) console.warn(`    - ${k}`);
}
console.warn("Add the missing keys to both blocks before finishing this change.");
process.exit(0);
