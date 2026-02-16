#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const errors = [];
const warnings = [];

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function regexAll(text, regex, group = 1) {
  const values = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    values.push(match[group]);
  }
  return values;
}

function unique(values) {
  return [...new Set(values)];
}

function duplicates(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function collectArrayRefs(text, key, idPattern) {
  const blocks = regexAll(text, new RegExp(`${key}:\\s*\\[((?:[^\\]]|\\n)*?)\\]`, "g"));
  return unique(blocks.flatMap((block) => regexAll(block, idPattern)));
}

function ensureNoMissingRefs({ sourceName, refs, validSet, label }) {
  const missing = refs.filter((ref) => !validSet.has(ref));
  if (missing.length > 0) {
    errors.push(`${sourceName} has unknown ${label}: ${missing.join(", ")}`);
  }
}

function normalizeAisvsCategoryId(identifier) {
  const normalized = String(identifier || "").trim();

  if (/^v\d+$/i.test(normalized)) return normalized.toLowerCase();
  if (/^c\d+$/i.test(normalized)) return `v${normalized.slice(1)}`;
  if (/^v\d+\.\d+\.\d+$/i.test(normalized)) return normalized.toLowerCase().split(".")[0];

  return null;
}

function isValidAisvsMapping(mappingId, aisvsRequirementSet, aisvsCategorySet, aisvsCategoryCodeSet) {
  const normalized = String(mappingId || "").trim();
  if (!normalized) return false;

  if (/^v\d+\.\d+\.\d+$/i.test(normalized)) {
    return aisvsRequirementSet.has(normalized.toLowerCase());
  }
  if (/^v\d+$/i.test(normalized)) {
    return aisvsCategorySet.has(normalized.toLowerCase());
  }
  if (/^c\d+$/i.test(normalized)) {
    return aisvsCategoryCodeSet.has(normalized.toUpperCase());
  }

  return false;
}

function gatherSourceFiles(baseDirectory) {
  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(ts|tsx|js|jsx|md|json)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walk(path.join(projectRoot, baseDirectory));
  return files;
}

function isTokenReferencedInSource(token, baseDirectory = "src") {
  const files = gatherSourceFiles(baseDirectory);
  return files.some((filePath) => fs.readFileSync(filePath, "utf8").includes(token));
}

function run() {
  const securityData = readFile("src/components/components/securityData.ts");
  const architecturesData = readFile("src/components/components/architecturesData.ts");
  const frameworkData = readFile("src/components/components/frameworkData.ts");
  const threatIds = unique(regexAll(securityData, /^\s*"?(t\d+)"?:\s*\{/gm));
  const mitigationIds = unique(regexAll(securityData, /^\s*"?(m\d+)"?:\s*\{/gm));
  const aisvsCategoryIds = unique(regexAll(securityData, /^\s*"?(v\d+)"?:\s*\{/gm)).map((id) =>
    id.toLowerCase()
  );
  const aisvsCategoryCodes = unique(regexAll(securityData, /^\s*code:\s*"(C\d+)"\s*,?$/gm)).map((code) =>
    code.toUpperCase()
  );
  const aisvsRequirementIds = unique(regexAll(securityData, /id:\s*"(v\d+\.\d+\.\d+)"/g)).map((id) =>
    id.toLowerCase()
  );
  const aisvsRequirementCodes = regexAll(
    securityData,
    /id:\s*"v\d+\.\d+\.\d+"\s*,\s*code:\s*"(\d+\.\d+\.\d+)"/g
  );

  const threatSet = new Set(threatIds);
  const mitigationSet = new Set(mitigationIds);
  const aisvsCategorySet = new Set(aisvsCategoryIds);
  const aisvsCategoryCodeSet = new Set(aisvsCategoryCodes);
  const aisvsRequirementSet = new Set(aisvsRequirementIds);

  const requirementIdDuplicates = duplicates(aisvsRequirementIds);
  if (requirementIdDuplicates.length > 0) {
    errors.push(
      `Duplicate AISVS requirement IDs: ${requirementIdDuplicates
        .map((entry) => `${entry.value} (x${entry.count})`)
        .join(", ")}`
    );
  }

  const requirementCodeDuplicates = duplicates(aisvsRequirementCodes);
  if (requirementCodeDuplicates.length > 0) {
    errors.push(
      `Duplicate AISVS requirement codes: ${requirementCodeDuplicates
        .map((entry) => `${entry.value} (x${entry.count})`)
        .join(", ")}`
    );
  }

  const frameworkStart = frameworkData.indexOf("export const frameworkData");
  const frameworkSlice = frameworkStart >= 0 ? frameworkData.slice(frameworkStart) : frameworkData;
  const componentIds = unique(regexAll(frameworkSlice, /id:\s*"(kc\d+(?:\.\d+)*)"/g));
  const componentSet = new Set(componentIds);

  const architectureThreatRefs = collectArrayRefs(architecturesData, "threatIds", /"(t\d+)"/g);
  const architectureMitigationRefs = collectArrayRefs(architecturesData, "mitigationIds", /"(m\d+)"/g);
  const architectureComponentRefs = collectArrayRefs(
    architecturesData,
    "keyComponents",
    /"(kc\d+(?:\.\d+)*)"/g
  );

  ensureNoMissingRefs({
    sourceName: "architecturesData.ts",
    refs: architectureThreatRefs,
    validSet: threatSet,
    label: "threatIds",
  });
  ensureNoMissingRefs({
    sourceName: "architecturesData.ts",
    refs: architectureMitigationRefs,
    validSet: mitigationSet,
    label: "mitigationIds",
  });
  ensureNoMissingRefs({
    sourceName: "architecturesData.ts",
    refs: architectureComponentRefs,
    validSet: componentSet,
    label: "keyComponents",
  });

  console.log("📊 Data Integrity Summary");
  console.log("========================");
  console.log(`Threats: ${threatIds.length}`);
  console.log(`Mitigations: ${mitigationIds.length}`);
  console.log(`Components: ${componentIds.length}`);
  console.log(`AISVS Categories: ${aisvsCategoryIds.length}`);
  console.log(`AISVS Requirements: ${aisvsRequirementIds.length}`);

  if (warnings.length > 0) {
    console.log("\n⚠️ Warnings:");
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach((error) => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log("\n✅ Data integrity checks passed.");
}

run();
