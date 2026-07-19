import { spawn } from "node:child_process";
import { readFile, mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(root, "output", "lighthouse");
const astroCli = join(root, "node_modules", "astro", "bin", "astro.mjs");
const lighthouseCli = join(root, "node_modules", "lighthouse", "cli", "index.js");
const shouldCheck = process.argv.includes("--check");

const profiles = [
  { name: "mobile", arguments: [] },
  { name: "desktop", arguments: ["--preset=desktop"] }
];

const thresholds = {
  categories: {
    accessibility: 1,
    "best-practices": 1,
    seo: 1
  },
  audits: {
    "cumulative-layout-shift": 0.1,
    "total-blocking-time": 200,
    "largest-contentful-paint": 3500
  }
};

function run(command, arguments_, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: root,
      env: process.env,
      stdio: "inherit",
      ...options
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve(child);
        return;
      }

      reject(new Error(`${command} exited with ${signal ? `signal ${signal}` : `code ${code}`}`));
    });
  });
}

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Unable to allocate a preview port"));
        return;
      }

      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForPreview(url, child) {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Astro preview exited early with code ${child.exitCode}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server may still be binding the port.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Astro preview did not become ready at ${url}`);
}

async function stopPreview(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3_000))
  ]);

  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
  }
}

async function runLighthouse(url, profile) {
  console.log(`\nRunning Lighthouse (${profile.name})...`);
  await run(process.execPath, [
    lighthouseCli,
    url,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--output=html",
    "--output=json",
    `--output-path=${join(outputDirectory, profile.name)}`,
    "--chrome-flags=--headless",
    "--quiet",
    ...profile.arguments
  ]);
}

function formatScore(score) {
  return Math.round(score * 100);
}

async function checkReport(profile) {
  const reportPath = join(outputDirectory, `${profile.name}.report.json`);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  const failures = [];

  const performanceScore = report.categories.performance?.score;
  if (profile.name === "mobile") {
    if (!Number.isFinite(performanceScore)) {
      failures.push("performance score unavailable");
    } else if (performanceScore < 0.9) {
      failures.push(`performance ${formatScore(performanceScore)} < 90`);
    }
  }

  for (const [category, minimum] of Object.entries(thresholds.categories)) {
    const score = report.categories[category]?.score;
    if (!Number.isFinite(score)) {
      failures.push(`${category} score unavailable`);
    } else if (score < minimum) {
      failures.push(`${category} ${formatScore(score)} < ${formatScore(minimum)}`);
    }
  }

  for (const [audit, maximum] of Object.entries(thresholds.audits)) {
    const value = report.audits[audit]?.numericValue;
    if (!Number.isFinite(value)) {
      failures.push(`${audit} value unavailable`);
    } else if (value > maximum) {
      failures.push(`${audit} ${value.toFixed(2)} > ${maximum}`);
    }
  }

  const scores = ["performance", "accessibility", "best-practices", "seo"]
    .map((category) => `${category}=${formatScore(report.categories[category].score)}`)
    .join(", ");
  console.log(`${profile.name}: ${scores}`);

  return failures.map((failure) => `${profile.name}: ${failure}`);
}

let preview;

async function handleSignal(signal) {
  await stopPreview(preview);
  process.exit(signal === "SIGINT" ? 130 : 143);
}

process.once("SIGINT", () => void handleSignal("SIGINT"));
process.once("SIGTERM", () => void handleSignal("SIGTERM"));

try {
  await mkdir(outputDirectory, { recursive: true });
  await run(process.execPath, [astroCli, "build"]);

  const port = await findAvailablePort();
  const url = `http://127.0.0.1:${port}/`;
  preview = spawn(
    process.execPath,
    [astroCli, "preview", "--host", "127.0.0.1", "--port", String(port)],
    { cwd: root, env: process.env, stdio: "inherit" }
  );
  await waitForPreview(url, preview);

  for (const profile of profiles) {
    await runLighthouse(url, profile);
  }

  if (shouldCheck) {
    const failures = (await Promise.all(profiles.map((profile) => checkReport(profile)))).flat();

    if (failures.length > 0) {
      throw new Error(`Lighthouse thresholds failed:\n- ${failures.join("\n- ")}`);
    }

    console.log("Lighthouse thresholds passed.");
  }
} finally {
  await stopPreview(preview);
}
