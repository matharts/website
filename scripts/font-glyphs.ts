import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const visibleTextPatterns = [
  "src/**/*.{astro,ts,tsx,js,jsx,md,mdx,json,yaml,yml}",
  "public/**/*.{txt,json,xml,html}"
];

const fontGlyphPattern = /[\p{L}\p{M}\p{N}\p{P}\p{S}]/gu;
const serifTagPattern = /<(h[1-3]|dt|dd|strong|label|a|span)\b[^>]*>([\s\S]*?)<\/\1>/giu;
const serifMonogramPattern =
  /<p\b[^>]*class=["'][^"']*hero__monogram[^"']*["'][^>]*>([\s\S]*?)<\/p>/giu;
const dataTitlePattern = /\btitle:\s*["'`]([^"'`]+)["'`]/gu;

function uniqueGlyphs(text: string): string[] {
  return [...new Set([" ", ...(text.match(fontGlyphPattern) ?? [])])].sort(
    (left, right) => (left.codePointAt(0) ?? 0) - (right.codePointAt(0) ?? 0)
  );
}

function stripMarkup(text: string): string {
  return text.replace(/\{[^{}]*\}/gu, "").replace(/<[^>]+>/gu, "");
}

export function collectFontGlyphs(projectRoot: string): string[] {
  const sourceFiles = globSync(visibleTextPatterns, { cwd: projectRoot }).sort();
  const glyphs = sourceFiles.flatMap(
    (file) => readFileSync(resolve(projectRoot, file), "utf8").match(fontGlyphPattern) ?? []
  );

  return uniqueGlyphs(glyphs.join(""));
}

export function collectSerifFontGlyphs(projectRoot: string): string[] {
  const sourceFiles = globSync(["src/**/*.{astro,ts,tsx,js,jsx}"], {
    cwd: projectRoot
  }).sort();
  const serifText = sourceFiles.flatMap((file) => {
    const source = readFileSync(resolve(projectRoot, file), "utf8");
    const taggedText = [...source.matchAll(serifTagPattern)].map((match) => match[2] ?? "");
    const monograms = [...source.matchAll(serifMonogramPattern)].map((match) => match[1] ?? "");
    const dataTitles = [...source.matchAll(dataTitlePattern)].map((match) => match[1] ?? "");
    return [...taggedText, ...monograms, ...dataTitles].map(stripMarkup);
  });

  return uniqueGlyphs(serifText.join(""));
}
