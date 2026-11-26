import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const base = "/klick-desk/";
async function filesIn(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? filesIn(`${dir}/${entry.name}`)
        : `${dir}/${entry.name}`,
    ),
  );
  return files.flat();
}
const files = (await filesIn("dist"))
  .filter((file) => !file.endsWith("sw.js") && !file.endsWith("404.html"))
  .sort();
const template = await readFile("scripts/service-worker.js", "utf8");
const hash = createHash("sha256").update(template);
for (const file of files) hash.update(await readFile(file));
const version = hash.digest("hex").slice(0, 12);
const precache = files.map((file) => base + file.slice(5));
const source = template
  .replace(
    "const VERSION = __VERSION__;",
    `const VERSION = ${JSON.stringify(version)};`,
  )
  .replace(
    "const PRECACHE = __PRECACHE__;",
    `const PRECACHE = ${JSON.stringify(precache)};`,
  );
await writeFile("dist/sw.js", source);
console.log(`Service worker ${version}: ${precache.length} precached files`);
