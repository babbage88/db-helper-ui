import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = process.cwd();
const inputSpec = path.resolve(rootDir, "../go-infra/swagger.json");
const sanitizedSpec = path.resolve(rootDir, ".openapi/swagger.sanitized.json");
const outputDir = path.resolve(rootDir, "src/lib/api");

const preservedFiles = [
  path.resolve(rootDir, "src/lib/api/core/request.ts"),
  path.resolve(rootDir, "src/lib/api/core/OpenAPI.ts"),
];

const backups = new Map();

for (const filePath of preservedFiles) {
  if (fs.existsSync(filePath)) {
    backups.set(filePath, fs.readFileSync(filePath, "utf8"));
  }
}

try {
  execFileSync("node", ["./scripts/sanitize-openapi-spec.mjs", inputSpec, sanitizedSpec], {
    cwd: rootDir,
    stdio: "inherit",
  });

  execFileSync("npx", ["openapi-typescript-codegen", "-i", sanitizedSpec, "-o", outputDir, "--client", "axios"], {
    cwd: rootDir,
    stdio: "inherit",
  });

  for (const [filePath, contents] of backups.entries()) {
    fs.writeFileSync(filePath, contents);
  }
} catch (error) {
  for (const [filePath, contents] of backups.entries()) {
    fs.writeFileSync(filePath, contents);
  }
  throw error;
}
