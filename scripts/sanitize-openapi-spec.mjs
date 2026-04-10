import fs from "node:fs";
import path from "node:path";

const [, , inputArg, outputArg] = process.argv;

if (!inputArg || !outputArg) {
  console.error("Usage: node scripts/sanitize-openapi-spec.mjs <input-spec> <output-spec>");
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputArg);
const outputPath = path.resolve(process.cwd(), outputArg);

const spec = JSON.parse(fs.readFileSync(inputPath, "utf8"));

if (spec.definitions?.UUID) {
  spec.definitions.UUID = {
    ...spec.definitions.UUID,
    type: "string",
    format: "uuid",
  };
  delete spec.definitions.UUID.items;
}

if (spec.definitions?.Addr) {
  spec.definitions.Addr = {
    ...spec.definitions.Addr,
    type: "string",
  };
}

function resolveDefinition(ref) {
  if (!ref?.startsWith("#/definitions/")) {
    return null;
  }

  const defName = ref.slice("#/definitions/".length);
  return {
    name: defName,
    schema: spec.definitions?.[defName] ?? null,
  };
}

function normalizeReferencedParameter(parameter) {
  if (!parameter || parameter.in === "body" || !parameter.$ref) {
    return parameter;
  }

  const resolved = resolveDefinition(parameter.$ref);
  if (!resolved?.schema) {
    return parameter;
  }

  const nextParameter = { ...parameter };
  delete nextParameter.$ref;

  if (resolved.name === "UUID") {
    nextParameter.type = "string";
    nextParameter.format = "uuid";
    return nextParameter;
  }

  if (resolved.schema.type && resolved.schema.type !== "object" && resolved.schema.type !== "array") {
    nextParameter.type = resolved.schema.type;
    if (resolved.schema.format) {
      nextParameter.format = resolved.schema.format;
    }
    return nextParameter;
  }

  // Fallback for referenced non-body parameters that point at complex schemas.
  nextParameter.type = "string";
  return nextParameter;
}

let normalizedCount = 0;

for (const pathItem of Object.values(spec.paths ?? {})) {
  for (const [method, operation] of Object.entries(pathItem ?? {})) {
    if (!["get", "post", "put", "delete", "patch", "options", "head"].includes(method)) {
      continue;
    }

    if (!Array.isArray(operation.parameters)) {
      continue;
    }

    operation.parameters = operation.parameters.map((parameter) => {
      const normalized = normalizeReferencedParameter(parameter);
      if (normalized !== parameter) {
        normalizedCount += 1;
      }
      return normalized;
    });
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
console.log(`Sanitized OpenAPI spec written to ${outputPath} (${normalizedCount} parameter(s) normalized).`);
