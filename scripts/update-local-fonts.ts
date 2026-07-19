import { spawnSync } from "node:child_process";
import { createHash, type BinaryLike } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fontToolsVersion, fonts, googleFontsRevision } from "./font-config.ts";
import { collectFontGlyphs, collectSerifFontGlyphs } from "./font-glyphs.ts";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceArgument = process.argv.slice(2).find((argument) => argument !== "--");
const sourceRoot = sourceArgument ? resolve(sourceArgument) : "";
const outputRoot = fileURLToPath(new URL("../src/assets/fonts/", import.meta.url));

if (!sourceRoot) {
  console.error("Usage: nub run fonts:update -- /absolute/path/to/google-fonts");
  process.exit(1);
}

function run(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || `Failed to run ${command}`);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

const sourceRevision = run("git", ["-C", sourceRoot, "rev-parse", "HEAD"]);
if (sourceRevision !== googleFontsRevision) {
  console.error(
    `Expected google/fonts ${googleFontsRevision}, received ${sourceRevision || "unknown"}.`
  );
  process.exit(1);
}

const executableLookup = process.platform === "win32" ? "where" : "which";
const pyftsubsetPath = run(executableLookup, ["pyftsubset"]).split(/\r?\n/)[0];
const shebang = readFileSync(pyftsubsetPath, "utf8").split(/\r?\n/, 1)[0];
if (!shebang.startsWith("#!")) {
  console.error(`Cannot determine the Python interpreter used by ${pyftsubsetPath}.`);
  process.exit(1);
}

const [pythonExecutable, ...pythonArguments] = shebang.slice(2).trim().split(/\s+/);
if (!pythonExecutable) {
  console.error(`Cannot determine the Python interpreter used by ${pyftsubsetPath}.`);
  process.exit(1);
}
const installedFontToolsVersion = run(pythonExecutable, [
  ...pythonArguments,
  "-c",
  "import fontTools; print(fontTools.__version__)"
]);
if (installedFontToolsVersion !== fontToolsVersion) {
  console.error(
    `Expected FontTools ${fontToolsVersion}, received ${installedFontToolsVersion || "unknown"}.`
  );
  process.exit(1);
}

const coverageScript = [
  "from fontTools.ttLib import TTFont",
  "import sys",
  "source = set((TTFont(sys.argv[1]).getBestCmap() or {}).keys())",
  "subset = set((TTFont(sys.argv[2]).getBestCmap() or {}).keys())",
  "expected = {ord(char) for char in open(sys.argv[3], encoding='utf-8').read()}",
  "missing = sorted((expected & source) - subset)",
  "if missing: raise SystemExit('Missing codepoints: ' + ', '.join(f'U+{value:04X}' for value in missing))"
].join("\n");

function sha256(content: BinaryLike): string {
  return createHash("sha256").update(content).digest("hex");
}

mkdirSync(outputRoot, { recursive: true });
const temporaryRoot = mkdtempSync(resolve(outputRoot, ".update-"));

try {
  const glyphManifests = {
    "glyphs.txt": collectFontGlyphs(projectRoot).join(""),
    "serif-glyphs.txt": collectSerifFontGlyphs(projectRoot).join("")
  };
  for (const [filename, glyphs] of Object.entries(glyphManifests)) {
    writeFileSync(resolve(temporaryRoot, filename), glyphs);
  }

  for (const font of fonts) {
    const sourcePath = resolve(sourceRoot, font.source);
    const outputPath = resolve(temporaryRoot, font.output);
    const glyphManifest = resolve(temporaryRoot, font.glyphManifest);
    run("pyftsubset", [
      sourcePath,
      `--output-file=${outputPath}`,
      "--flavor=woff2",
      `--text-file=${glyphManifest}`,
      "--layout-features=*",
      "--name-IDs=*",
      "--name-languages=*",
      "--glyph-names",
      "--symbol-cmap",
      "--legacy-cmap",
      "--notdef-glyph",
      "--notdef-outline",
      "--recommended-glyphs"
    ]);
    run(pythonExecutable, [
      ...pythonArguments,
      "-c",
      coverageScript,
      sourcePath,
      outputPath,
      glyphManifest
    ]);
    copyFileSync(resolve(sourceRoot, font.license), resolve(temporaryRoot, font.licenseOutput));
  }

  const files = Object.fromEntries(
    fonts.map((font) => [font.output, sha256(readFileSync(resolve(temporaryRoot, font.output)))])
  );
  writeFileSync(
    resolve(temporaryRoot, "manifest.json"),
    `${JSON.stringify(
      {
        sourceRevision,
        fontToolsVersion: installedFontToolsVersion,
        glyphs: Object.fromEntries(
          Object.entries(glyphManifests).map(([filename, glyphs]) => [filename, sha256(glyphs)])
        ),
        files
      },
      null,
      2
    )}\n`
  );
  writeFileSync(
    resolve(temporaryRoot, "PROVENANCE.txt"),
    [
      "Source: https://github.com/google/fonts",
      `Revision: ${sourceRevision}`,
      `FontTools: ${installedFontToolsVersion}`,
      "Generated with pyftsubset from the visible source glyph manifest.",
      ""
    ].join("\n")
  );

  for (const filename of [
    "glyphs.txt",
    "serif-glyphs.txt",
    "manifest.json",
    "PROVENANCE.txt",
    ...fonts.flatMap((font) => [font.output, font.licenseOutput])
  ]) {
    renameSync(resolve(temporaryRoot, filename), resolve(outputRoot, filename));
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
