#!/usr/bin/env node

import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const errors = [];
const warnings = [];
const notes = [];
const collectedReferenceUrls = [];

const args = new Set(process.argv.slice(2));
const shouldCheckLinks = args.has("--check-links");

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function addNote(message) {
  notes.push(message);
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function loadJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

function loadTsModule(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");

  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  });

  const module = { exports: {} };
  const exports = module.exports;

  const localRequire = (specifier) => {
    throw new Error(`Unsupported import "${specifier}" while loading ${relativePath}`);
  };

  const context = {
    module,
    exports,
    require: localRequire,
    __filename: absolutePath,
    __dirname: path.dirname(absolutePath),
    console,
    process,
    Buffer,
    URL,
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(outputText, context, { filename: absolutePath });
  return module.exports;
}

function unique(values) {
  return [...new Set(values)];
}

function listDuplicates(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function ensure(condition, message) {
  if (!condition) {
    addError(message);
  }
}

function warnIf(condition, message) {
  if (condition) {
    addWarning(message);
  }
}

function ensureIdFormat(owner, value, regex, label) {
  ensure(regex.test(String(value || "")), `${owner} has invalid ${label}: ${String(value)}`);
}

function ensureIsoDate(owner, value) {
  if (value == null || value === "") return;
  ensure(
    /^\d{4}-\d{2}-\d{2}$/.test(String(value)),
    `${owner} has invalid lastUpdated date (expected YYYY-MM-DD): ${value}`,
  );
}

function isValidHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function collectReference(owner, reference, index) {
  if (!reference || typeof reference !== "object") {
    addError(`${owner} reference[${index}] is not an object`);
    return;
  }

  const title = String(reference.title || "").trim();
  const url = String(reference.url || "").trim();

  ensure(title.length > 0, `${owner} reference[${index}] is missing title`);
  ensure(url.length > 0, `${owner} reference[${index}] is missing url`);

  if (url.length > 0) {
    ensure(isValidHttpUrl(url), `${owner} reference[${index}] has invalid URL: ${url}`);
    warnIf(url.startsWith("http://"), `${owner} reference[${index}] uses insecure HTTP URL: ${url}`);
    warnIf(/[),.;\]}]$/.test(url), `${owner} reference[${index}] URL may include trailing punctuation: ${url}`);
    collectedReferenceUrls.push({ owner, title, url });
  }
}

function validateReferences(owner, references) {
  if (references == null) return;

  ensure(Array.isArray(references), `${owner} references must be an array`);
  if (!Array.isArray(references)) return;

  if (references.length === 0) {
    addWarning(`${owner} has an empty references array`);
  }

  references.forEach((reference, index) => collectReference(owner, reference, index));

  const duplicateTitles = listDuplicates(
    references
      .map((ref) => (ref && typeof ref === "object" ? String(ref.title || "").trim() : ""))
      .filter(Boolean),
  );

  if (duplicateTitles.length > 0) {
    addWarning(
      `${owner} has duplicate reference titles: ${duplicateTitles
        .map(({ value, count }) => `${value} (x${count})`)
        .join(", ")}`,
    );
  }
}

function collectComponentIds(nodes, ids = [], nodeThreatRefs = []) {
  for (const node of safeArray(nodes)) {
    if (!node || typeof node !== "object") continue;
    const id = String(node.id || "").trim().toLowerCase();
    if (id) ids.push(id);

    const threatIds = safeArray(node.threatIds).map((threatId) => String(threatId));
    if (threatIds.length > 0) {
      nodeThreatRefs.push({ id, threatIds });
    }

    collectComponentIds(node.children, ids, nodeThreatRefs);
  }

  return { ids, nodeThreatRefs };
}

function parseNistAisvsMappings(nistSource) {
  const results = [];
  const pattern = /aisvsMapping:\s*\[((?:.|\n)*?)\]/g;
  let match;

  while ((match = pattern.exec(nistSource)) !== null) {
    const block = match[1];
    const line = nistSource.slice(0, match.index).split("\n").length;
    const codes = [...block.matchAll(/"(C\d+)"/g)].map((entry) => entry[1]);
    results.push({ line, codes });
  }

  return results;
}

function flattenAisvs(aisvsData) {
  const categories = [];
  const subCategories = [];
  const requirements = [];

  for (const [categoryId, category] of Object.entries(safeObject(aisvsData))) {
    categories.push({ categoryId, category });
    for (const subCategory of safeArray(category.subCategories)) {
      subCategories.push({ categoryId, category, subCategory });
      for (const requirement of safeArray(subCategory.requirements)) {
        requirements.push({ categoryId, category, subCategory, requirement });
      }
    }
  }

  return { categories, subCategories, requirements };
}

function requireObject(name, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} is missing or not an object`);
  }
  return value;
}

function requireArray(name, value) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} is missing or not an array`);
  }
  return value;
}

async function checkLinkReachability(urls) {
  const uniqueUrls = unique(urls);
  let checked = 0;

  const checkSingle = async (url) => {
    const timeoutMs = 10000;

    const fetchWithTimeout = async (targetUrl, init) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(targetUrl, { ...init, signal: controller.signal, redirect: "follow" });
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      let response = await fetchWithTimeout(url, { method: "HEAD" });
      if (!response.ok && [400, 401, 403, 405, 500, 501].includes(response.status)) {
        response = await fetchWithTimeout(url, { method: "GET" });
      }

      if (!response.ok) {
        addWarning(`Link check failed (${response.status}) for ${url}`);
      }
    } catch (error) {
      addWarning(`Link check could not verify ${url}: ${error.message}`);
    } finally {
      checked += 1;
      if (checked % 50 === 0) {
        addNote(`Link reachability progress: ${checked}/${uniqueUrls.length}`);
      }
    }
  };

  for (const url of uniqueUrls) {
    // Sequential to avoid accidental rate-limiting and noisy failures.
    await checkSingle(url);
  }
}

async function run() {
  const securityModule = loadTsModule("src/components/components/securityData.ts");
  const frameworkModule = loadTsModule("src/components/components/frameworkData.ts");
  const architectureModule = loadTsModule("src/components/components/architecturesData.ts");
  const top10Module = loadTsModule("src/components/components/owaspAgenticTop10Data.ts");
  const ciscoRaw = loadJson("src/components/components/cisco_taxonomy.json");
  const nistSource = readFile("src/pages/NISTMapping.tsx");

  const threatsData = requireObject("threatsData", securityModule.threatsData);
  const mitigationsData = requireObject("mitigationsData", securityModule.mitigationsData);
  const aisvsData = requireObject("aisvsData", securityModule.aisvsData);
  const frameworkData = requireArray("frameworkData", frameworkModule.frameworkData);
  const architecturesData = requireObject("architecturesData", architectureModule.architecturesData);
  const agenticTop10Data = requireArray("agenticTop10Data", top10Module.agenticTop10Data);

  const threatEntries = Object.entries(threatsData);
  const mitigationEntries = Object.entries(mitigationsData);
  const architectureEntries = Object.entries(architecturesData);

  const threatIds = threatEntries.map(([id]) => id);
  const mitigationIds = mitigationEntries.map(([id]) => id);
  const threatSet = new Set(threatIds);
  const mitigationSet = new Set(mitigationIds);

  const { ids: componentIds, nodeThreatRefs } = collectComponentIds(frameworkData);
  const normalizedComponentIds = componentIds.map((id) => id.toLowerCase());
  const componentSet = new Set(normalizedComponentIds);

  const duplicateComponents = listDuplicates(normalizedComponentIds);
  if (duplicateComponents.length > 0) {
    addError(
      `Duplicate component IDs in frameworkData: ${duplicateComponents
        .map(({ value, count }) => `${value} (x${count})`)
        .join(", ")}`,
    );
  }

  for (const [threatKey, threat] of threatEntries) {
    const owner = `Threat ${threatKey}`;
    ensure(threat && typeof threat === "object", `${owner} is not an object`);
    if (!threat || typeof threat !== "object") continue;

    ensure(String(threat.id) === threatKey, `${owner} has mismatched id field: ${threat.id}`);
    ensureIdFormat(owner, threat.id, /^t\d+$/, "id");
    ensureIdFormat(owner, threat.code, /^T\d+$/, "code");
    ensure(typeof threat.name === "string" && threat.name.trim().length > 0, `${owner} is missing name`);
    ensure(
      typeof threat.description === "string" && threat.description.trim().length > 0,
      `${owner} is missing description`,
    );
    ensure(
      ["high", "medium", "low"].includes(String(threat.impactLevel)),
      `${owner} has invalid impactLevel: ${threat.impactLevel}`,
    );

    ensure(Array.isArray(threat.componentIds), `${owner} componentIds must be an array`);
    const threatComponents = safeArray(threat.componentIds).map((id) => String(id).toLowerCase());
    ensure(threatComponents.length > 0, `${owner} has no componentIds`);
    for (const componentId of threatComponents) {
      ensure(componentSet.has(componentId), `${owner} references unknown componentId: ${componentId}`);
    }

    ensure(Array.isArray(threat.mitigationIds), `${owner} mitigationIds must be an array`);
    const threatMitigations = safeArray(threat.mitigationIds).map((id) => String(id));
    ensure(threatMitigations.length > 0, `${owner} has no mitigationIds`);
    for (const mitigationId of threatMitigations) {
      ensure(mitigationSet.has(mitigationId), `${owner} references unknown mitigationId: ${mitigationId}`);
    }

    ensure(
      typeof threat.riskScore === "number" && threat.riskScore >= 1 && threat.riskScore <= 10,
      `${owner} has invalid riskScore (expected 1-10): ${threat.riskScore}`,
    );

    ensureIsoDate(owner, threat.lastUpdated);
    validateReferences(owner, threat.references);
  }

  for (const [mitigationKey, mitigation] of mitigationEntries) {
    const owner = `Mitigation ${mitigationKey}`;
    ensure(mitigation && typeof mitigation === "object", `${owner} is not an object`);
    if (!mitigation || typeof mitigation !== "object") continue;

    ensure(String(mitigation.id) === mitigationKey, `${owner} has mismatched id field: ${mitigation.id}`);
    ensureIdFormat(owner, mitigation.id, /^m\d+$/, "id");
    ensure(typeof mitigation.name === "string" && mitigation.name.trim().length > 0, `${owner} is missing name`);
    ensure(
      typeof mitigation.description === "string" && mitigation.description.trim().length > 0,
      `${owner} is missing description`,
    );

    ensure(Array.isArray(mitigation.threatIds), `${owner} threatIds must be an array`);
    const linkedThreats = safeArray(mitigation.threatIds).map((id) => String(id));
    ensure(linkedThreats.length > 0, `${owner} has no threatIds`);
    for (const threatId of linkedThreats) {
      ensure(threatSet.has(threatId), `${owner} references unknown threatId: ${threatId}`);
    }

    const detail = safeObject(mitigation.implementationDetail);
    ensure(
      typeof detail.design === "string" && detail.design.trim().length > 0,
      `${owner} implementationDetail.design is empty`,
    );
    ensure(
      typeof detail.build === "string" && detail.build.trim().length > 0,
      `${owner} implementationDetail.build is empty`,
    );
    ensure(
      typeof detail.operations === "string" && detail.operations.trim().length > 0,
      `${owner} implementationDetail.operations is empty`,
    );
    ensure(
      typeof detail.toolsAndFrameworks === "string" && detail.toolsAndFrameworks.trim().length > 0,
      `${owner} implementationDetail.toolsAndFrameworks is empty`,
    );

    ensure(
      mitigation.designPhase || mitigation.buildPhase || mitigation.operationPhase,
      `${owner} has no lifecycle phase flags enabled`,
    );

    ensure(
      typeof mitigation.riskScore === "number" && mitigation.riskScore >= 1 && mitigation.riskScore <= 10,
      `${owner} has invalid riskScore (expected 1-10): ${mitigation.riskScore}`,
    );

    ensureIsoDate(owner, mitigation.lastUpdated);
    validateReferences(owner, mitigation.references);
  }

  for (const [mitigationKey, mitigation] of mitigationEntries) {
    for (const threatId of safeArray(mitigation.threatIds)) {
      const threat = threatsData[threatId];
      if (!threat) continue;
      const owner = `Mitigation ${mitigationKey}`;
      ensure(
        safeArray(threat.mitigationIds).includes(mitigationKey),
        `${owner} links to ${threatId} but ${threatId} is missing reverse mitigation link`,
      );
    }
  }

  for (const [threatKey, threat] of threatEntries) {
    for (const mitigationId of safeArray(threat.mitigationIds)) {
      const mitigation = mitigationsData[mitigationId];
      if (!mitigation) continue;
      const owner = `Threat ${threatKey}`;
      ensure(
        safeArray(mitigation.threatIds).includes(threatKey),
        `${owner} links to ${mitigationId} but ${mitigationId} is missing reverse threat link`,
      );
    }
  }

  const threatToMitigationCoverage = new Map(threatIds.map((threatId) => [threatId, 0]));
  for (const mitigation of Object.values(mitigationsData)) {
    for (const threatId of safeArray(mitigation.threatIds)) {
      threatToMitigationCoverage.set(threatId, (threatToMitigationCoverage.get(threatId) || 0) + 1);
    }
  }
  for (const [threatId, coverageCount] of threatToMitigationCoverage.entries()) {
    ensure(coverageCount > 0, `Threat ${threatId} is not covered by any mitigation`);
  }

  for (const [architectureKey, architecture] of architectureEntries) {
    const owner = `Architecture ${architectureKey}`;
    ensure(architecture && typeof architecture === "object", `${owner} is not an object`);
    if (!architecture || typeof architecture !== "object") continue;

    ensure(String(architecture.id) === architectureKey, `${owner} has mismatched id field`);
    ensure(
      typeof architecture.name === "string" && architecture.name.trim().length > 0,
      `${owner} is missing name`,
    );
    ensure(
      typeof architecture.description === "string" && architecture.description.trim().length > 0,
      `${owner} is missing description`,
    );

    ensure(Array.isArray(architecture.keyComponents), `${owner} keyComponents must be an array`);
    ensure(Array.isArray(architecture.threatIds), `${owner} threatIds must be an array`);
    ensure(Array.isArray(architecture.mitigationIds), `${owner} mitigationIds must be an array`);

    ensure(safeArray(architecture.keyComponents).length > 0, `${owner} has no keyComponents`);
    ensure(safeArray(architecture.threatIds).length > 0, `${owner} has no threatIds`);
    ensure(safeArray(architecture.mitigationIds).length > 0, `${owner} has no mitigationIds`);

    for (const componentId of safeArray(architecture.keyComponents).map((id) => String(id).toLowerCase())) {
      ensure(componentSet.has(componentId), `${owner} references unknown keyComponent: ${componentId}`);
    }

    for (const threatId of safeArray(architecture.threatIds)) {
      ensure(threatSet.has(String(threatId)), `${owner} references unknown threatId: ${threatId}`);
    }

    for (const mitigationId of safeArray(architecture.mitigationIds)) {
      ensure(mitigationSet.has(String(mitigationId)), `${owner} references unknown mitigationId: ${mitigationId}`);
    }

    for (const threatId of safeArray(architecture.threatIds)) {
      const covered = safeArray(architecture.mitigationIds).some((mitigationId) =>
        safeArray(mitigationsData[mitigationId]?.threatIds).includes(threatId),
      );
      warnIf(
        !covered,
        `${owner} lists threat ${threatId} without a directly mapped mitigation in mitigationIds`,
      );
    }

    ensureIsoDate(owner, architecture.lastUpdated);
    validateReferences(owner, architecture.references);
  }

  for (const nodeRef of nodeThreatRefs) {
    for (const threatId of nodeRef.threatIds) {
      ensure(threatSet.has(threatId), `Component ${nodeRef.id} references unknown threatId: ${threatId}`);
    }
  }

  const ciscoObjectives = Object.entries(safeObject(ciscoRaw))
    .filter(([key]) => /^OB-\d+$/.test(key))
    .map(([key, value]) => {
      const code = String(value?.code || "");
      ensure(code === key, `Cisco taxonomy entry ${key} has mismatched code field: ${code}`);
      return key;
    });
  const ciscoObjectiveSet = new Set(ciscoObjectives);

  const top10Codes = new Set();
  const top10ThreatRefs = new Set();
  for (const entry of agenticTop10Data) {
    const owner = `OWASP Agentic Top10 ${entry?.id}`;
    ensure(entry && typeof entry === "object", `${owner} is not an object`);
    if (!entry || typeof entry !== "object") continue;

    ensureIdFormat(owner, entry.id, /^ASI\d{2}$/, "id");
    ensureIdFormat(owner, entry.code, /^ASI\d{2}$/, "code");
    ensure(entry.id === entry.code, `${owner} must use matching id and code`);
    ensure(typeof entry.name === "string" && entry.name.trim().length > 0, `${owner} is missing name`);
    ensure(
      typeof entry.description === "string" && entry.description.trim().length > 0,
      `${owner} is missing description`,
    );

    top10Codes.add(entry.code);

    const relatedThreats = safeArray(entry.relatedThreats).map((threatId) => String(threatId));
    ensure(relatedThreats.length > 0, `${owner} has no relatedThreats`);
    for (const threatId of relatedThreats) {
      top10ThreatRefs.add(threatId);
      ensure(threatSet.has(threatId), `${owner} references unknown threat ID: ${threatId}`);
    }

    const relatedCiscoObjectives = safeArray(entry.relatedCiscoObjectives).map((code) => String(code));
    for (const code of relatedCiscoObjectives) {
      ensure(ciscoObjectiveSet.has(code), `${owner} references unknown Cisco objective: ${code}`);
    }

    validateReferences(owner, entry.references);
  }

  const top10CodeDuplicates = listDuplicates(agenticTop10Data.map((entry) => String(entry.code)));
  if (top10CodeDuplicates.length > 0) {
    addError(
      `Duplicate OWASP Agentic Top 10 codes: ${top10CodeDuplicates
        .map(({ value, count }) => `${value} (x${count})`)
        .join(", ")}`,
    );
  }

  const threatAsiMappings = [];
  const threatCiscoMappings = [];
  for (const [threatKey, threat] of threatEntries) {
    for (const code of safeArray(threat.asiMapping).map((value) => String(value))) {
      threatAsiMappings.push({ threatKey, code });
      ensure(top10Codes.has(code), `Threat ${threatKey} references unknown ASI mapping: ${code}`);
    }

    for (const code of safeArray(threat.ciscoMapping).map((value) => String(value))) {
      threatCiscoMappings.push({ threatKey, code });
      ensure(ciscoObjectiveSet.has(code), `Threat ${threatKey} references unknown Cisco mapping: ${code}`);
    }
  }

  const unusedTop10Codes = [...top10Codes].filter(
    (code) => !threatAsiMappings.some((mapping) => mapping.code === code),
  );
  if (unusedTop10Codes.length > 0) {
    addWarning(
      `OWASP Agentic Top 10 entries not directly mapped from threatsData.asiMapping: ${unusedTop10Codes.join(", ")}`,
    );
  }

  const { categories, subCategories, requirements } = flattenAisvs(aisvsData);
  const aisvsCategoryIds = categories.map(({ categoryId }) => String(categoryId).toLowerCase());
  const aisvsCategoryCodes = categories.map(({ category }) => String(category.code).toUpperCase());
  const aisvsCategoryCodeSet = new Set(aisvsCategoryCodes);

  for (const { categoryId, category } of categories) {
    const owner = `AISVS category ${categoryId}`;
    ensure(String(category.id).toLowerCase() === String(categoryId).toLowerCase(), `${owner} has mismatched id`);
    ensureIdFormat(owner, category.id, /^v\d+$/i, "id");
    ensureIdFormat(owner, category.code, /^C\d+$/, "code");
    ensure(typeof category.name === "string" && category.name.trim().length > 0, `${owner} is missing name`);
    ensure(
      typeof category.description === "string" && category.description.trim().length > 0,
      `${owner} is missing description`,
    );
    ensure(safeArray(category.subCategories).length > 0, `${owner} has no subCategories`);
    validateReferences(owner, category.references);
  }

  for (const { categoryId, category, subCategory } of subCategories) {
    const owner = `AISVS subcategory ${subCategory.id}`;
    ensureIdFormat(owner, subCategory.id, /^v\d+\.\d+$/i, "id");
    ensureIdFormat(owner, subCategory.code, /^C\d+\.\d+$/, "code");
    ensure(
      String(subCategory.id).toLowerCase().startsWith(`${String(categoryId).toLowerCase()}.`),
      `${owner} does not belong to parent category ${categoryId}`,
    );
    ensure(
      String(subCategory.code).startsWith(`${String(category.code)}.`),
      `${owner} code does not align to parent code ${category.code}`,
    );
    ensure(
      typeof subCategory.name === "string" && subCategory.name.trim().length > 0,
      `${owner} is missing name`,
    );
    ensure(safeArray(subCategory.requirements).length > 0, `${owner} has no requirements`);
  }

  for (const { categoryId, subCategory, requirement } of requirements) {
    const owner = `AISVS requirement ${requirement.id}`;
    ensureIdFormat(owner, requirement.id, /^v\d+\.\d+\.\d+$/i, "id");
    ensureIdFormat(owner, requirement.code, /^\d+\.\d+\.\d+$/, "code");
    ensure(
      String(requirement.id).toLowerCase().startsWith(`${String(subCategory.id).toLowerCase()}.`),
      `${owner} does not belong to parent subcategory ${subCategory.id}`,
    );
    ensure(
      String(requirement.category).toLowerCase() === String(categoryId).toLowerCase(),
      `${owner} category field mismatch: ${requirement.category} (expected ${categoryId})`,
    );
    ensure(
      [1, 2, 3].includes(Number(requirement.level)),
      `${owner} has invalid level (expected 1, 2, or 3): ${requirement.level}`,
    );
    ensure(
      typeof requirement.title === "string" && requirement.title.trim().length > 0,
      `${owner} is missing title`,
    );
    ensure(
      typeof requirement.description === "string" && requirement.description.trim().length > 0,
      `${owner} is missing description`,
    );
    validateReferences(owner, requirement.references);
  }

  const requirementIdDuplicates = listDuplicates(
    requirements.map(({ requirement }) => String(requirement.id).toLowerCase()),
  );
  if (requirementIdDuplicates.length > 0) {
    addError(
      `Duplicate AISVS requirement IDs: ${requirementIdDuplicates
        .map(({ value, count }) => `${value} (x${count})`)
        .join(", ")}`,
    );
  }

  const requirementCodeDuplicates = listDuplicates(
    requirements.map(({ requirement }) => String(requirement.code)),
  );
  if (requirementCodeDuplicates.length > 0) {
    addError(
      `Duplicate AISVS requirement codes: ${requirementCodeDuplicates
        .map(({ value, count }) => `${value} (x${count})`)
        .join(", ")}`,
    );
  }

  const nistMappings = parseNistAisvsMappings(nistSource);
  const nistCodes = [];
  for (const mapping of nistMappings) {
    if (mapping.codes.length === 0) {
      addWarning(`NIST mapping block at line ${mapping.line} has an empty aisvsMapping array`);
    }

    const duplicates = listDuplicates(mapping.codes);
    if (duplicates.length > 0) {
      addWarning(
        `NIST mapping block at line ${mapping.line} has duplicate AISVS codes: ${duplicates
          .map(({ value, count }) => `${value} (x${count})`)
          .join(", ")}`,
      );
    }

    for (const code of mapping.codes) {
      nistCodes.push(code);
      ensure(
        aisvsCategoryCodeSet.has(code),
        `NIST mapping block at line ${mapping.line} references unknown AISVS category code: ${code}`,
      );
    }
  }

  const nistMappedSet = new Set(nistCodes);
  const unmappedAisvsCategories = aisvsCategoryCodes.filter((code) => !nistMappedSet.has(code));
  if (unmappedAisvsCategories.length > 0) {
    addWarning(`AISVS category codes not mapped in NISTMapping.tsx: ${unmappedAisvsCategories.join(", ")}`);
  }

  const duplicateReferenceUrls = listDuplicates(collectedReferenceUrls.map((entry) => entry.url));
  if (duplicateReferenceUrls.length > 0) {
    addNote(
      `Duplicate reference URLs reused across entries: ${duplicateReferenceUrls
        .slice(0, 20)
        .map(({ value, count }) => `${value} (x${count})`)
        .join(", ")}`,
    );
  }

  if (shouldCheckLinks) {
    await checkLinkReachability(collectedReferenceUrls.map((entry) => entry.url));
  } else {
    addNote("Live URL reachability was skipped (run with --check-links to enable network checks).");
  }

  console.log("📊 Data Integrity Summary");
  console.log("========================");
  console.log(`Threats: ${threatIds.length}`);
  console.log(`Mitigations: ${mitigationIds.length}`);
  console.log(`Components: ${componentSet.size}`);
  console.log(`Architectures: ${architectureEntries.length}`);
  console.log(`OWASP Agentic Top 10 Entries: ${agenticTop10Data.length}`);
  console.log(`Cisco Objective Groups: ${ciscoObjectives.length}`);
  console.log(`AISVS Categories: ${aisvsCategoryIds.length}`);
  console.log(`AISVS Requirements: ${requirements.length}`);
  console.log(`NIST AISVS Mapping References: ${nistCodes.length}`);
  console.log(`Reference URLs (unique): ${unique(collectedReferenceUrls.map((entry) => entry.url)).length}`);

  if (notes.length > 0) {
    console.log("\nℹ️ Notes:");
    notes.forEach((note) => console.log(`- ${note}`));
  }

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

run().catch((error) => {
  console.error("❌ Data integrity check failed unexpectedly.");
  console.error(error);
  process.exit(1);
});
