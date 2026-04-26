import { execFileSync } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const apiDir = path.resolve(rootDir, "src/lib/api");

try {
  execFileSync("node", ["./scripts/generate-api-client.mjs"], {
    cwd: rootDir,
    stdio: "inherit",
  });

  execFileSync("git", ["diff", "--exit-code", "--", apiDir], {
    cwd: rootDir,
    stdio: "inherit",
  });
} catch (error) {
  console.error("\nGenerated API client is out of date. Run `npm run gen-api` and commit the updated files.");
  process.exit(1);
}
