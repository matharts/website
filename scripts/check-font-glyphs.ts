import { createHash, type BinaryLike } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fontToolsVersion, fonts, googleFontsRevision } from "./font-config.ts";
import { collectFontGlyphs, collectSerifFontGlyphs } from "./font-glyphs.ts";

interface FontBuildManifest {
  sourceRevision?: string;
  fontToolsVersion?: string;
  glyphs?: Record<string, string>;
  files?: Record<string, string>;
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const buildManifestURL = new URL("../src/assets/fonts/manifest.json", import.meta.url);
const glyphManifests = {
  "glyphs.txt": collectFontGlyphs(projectRoot).join(""),
  "serif-glyphs.txt": collectSerifFontGlyphs(projectRoot).join("")
};

function sha256(content: BinaryLike): string {
  return createHash("sha256").update(content).digest("hex");
}

function fail(message: string): void {
  console.error(`${message} Run \`nub run fonts:update -- /absolute/path/to/google-fonts\`.`);
  process.exitCode = 1;
}

const buildManifest = JSON.parse(readFileSync(buildManifestURL, "utf8")) as FontBuildManifest;

if (
  buildManifest.sourceRevision !== googleFontsRevision ||
  buildManifest.fontToolsVersion !== fontToolsVersion
) {
  fail("Local font provenance is stale.");
}

for (const [filename, expected] of Object.entries(glyphManifests)) {
  const manifestURL = new URL(`../src/assets/fonts/${filename}`, import.meta.url);
  const actual = readFileSync(manifestURL, "utf8");
  if (actual !== expected || buildManifest.glyphs?.[filename] !== sha256(actual)) {
    fail(`Local font glyph manifest ${filename} is stale.`);
  }
}

for (const font of fonts) {
  const fontURL = new URL(`../src/assets/fonts/${font.output}`, import.meta.url);
  const fontHash = sha256(readFileSync(fontURL));
  if (buildManifest.files?.[font.output] !== fontHash) {
    fail(`Local font file ${font.output} does not match its manifest.`);
  }
}
