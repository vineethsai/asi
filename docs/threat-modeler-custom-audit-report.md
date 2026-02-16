# Threat Modeler: Custom Component & Threat Analysis Pipeline Audit

**Date:** February 16, 2025  
**Scope:** Custom component creation, custom threat analysis, and end-to-end data flow when a user adds custom components/threats/tools and runs analysis.

---

## Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Custom Component Creation | ✅ Works | Metadata flows correctly; minor gaps in `associatedThreatIds` |
| Custom Threat Collection | ⚠️ Partial | Works but only when `isCustom` + `customThreatIds` match; no refresh when component def changes |
| Threat Engine Integration | ✅ Works | Custom threats are merged and propagated |
| AISVS Mapping | ⚠️ Conditional | Custom threats included only when `maestroLayer` is set |
| Mitigation Catalog | ✅ Works | Handles all threats including custom |
| Data Integration (Enrichment) | ⚠️ Expected | Custom threats don't match catalog; no enrichment (by design) |
| Threat Results Panel | ✅ Works | All threats displayed; custom appear in "Other" tab |
| Inherited Threat Propagation | ✅ Works | Custom threats propagate downstream |
| Attack Paths | ❌ Gap | Custom components never as entry points or high-value targets |
| Node Editor | ❌ Gap | Tool/prompt/sensitivity fields hidden for `category === "custom"` |
| Export (Markdown, CSV, SARIF) | ✅ Works | All threats exported; no filtering |

---

## 1. CustomComponentDialog.tsx

### How Custom Components Are Created

- **Lines 90–106:** `handleSave` builds `CustomComponentDefinition`:
  - `id`: edit or `generateId()` (e.g. `custom-{timestamp}-{random}`)
  - `category`: hardcoded `"custom"`
  - `customThreats`: filtered to `t.name.trim()` — empty-name threats are dropped
  - `associatedThreatIds`: always `[]` and never populated

### Metadata Carried

| Field | Source | Notes |
|-------|--------|-------|
| `name`, `description` | User input | ✅ |
| `trustLevel` | User select | ✅ |
| `maestroLayers` | User select | ✅ |
| `color` | Color picker | ✅ |
| `customThreats` | User-defined threats with id, name, description, severity, maestroLayer, mitigations | ✅ |
| `associatedThreatIds` | Always `[]` | Not used; linking is via `customThreats[].id` |

### Gaps

- **Lines 100–101:** `associatedThreatIds: []` is always empty; linking is done via `customThreats` on the component. No functional impact.
- **Line 39:** `EMPTY_THREAT` defaults to `maestroLayer: MaestroLayer.AgentFrameworks`; new threats without an explicit layer get this.

---

## 2. ThreatModelCanvas.tsx — doAnalysis (Lines 307–413)

### Custom Threat Collection (Lines 311–336)

```typescript
const customThreats: GeneratedThreat[] = [];
for (const node of nodes) {
  if (node.data?.isCustom && node.data.customThreatIds) {
    for (const cc of customComponents) {
      for (const ct of cc.customThreats ?? []) {
        if (node.data.customThreatIds.includes(ct.id)) {
          customThreats.push({ ... });
        }
      }
    }
  }
}
```

### Flow

1. Only nodes with `isCustom` and `customThreatIds` are processed.
2. For each such node, all `customComponents` are scanned.
3. Any `cc.customThreats` whose `id` is in `node.data.customThreatIds` is converted to `GeneratedThreat` and pushed.
4. Custom threats are passed to `runThreatAnalysis(..., customThreats)`.

### Gaps

- **Stale component definitions:** If a custom component is edited after nodes are placed, those nodes keep old `customThreatIds` and do not pick up new/removed threats.
- **Orphaned nodes:** Nodes created from a component that was later deleted never get threats, because no `customComponent` will match their `customThreatIds`.
- **Missing `customThreatIds`:** Nodes created before this logic or with a bug could have `isCustom` but no `customThreatIds`; they will get no custom threats.

### Custom Threats → Engine

- **Lines 339–344:** Custom threats are passed into `runThreatAnalysis` as the 4th argument.
- **Lines 346–349:** Engine output is enriched via `enrichThreatsWithSecurityData` and stored.
- **Lines 371–401:** All threats (including custom) are used to build badges and applied to nodes/edges.

### Confirmation

- Custom threats participate in badges, risk, and attack paths.
- `fullAnalysisResult` and `filteredAnalysisResult` both include custom threats.

---

## 3. aisvsMapping.ts

### Behavior

- **Lines 88–129:** `runAISVSMapping` iterates over all threats.
- **Lines 109–113:** For each threat, keywords come from `MAESTRO_TO_AISVS_KEYWORDS[threat.maestroLayer]`. If `maestroLayer` is undefined, `keywords` is empty and the threat is skipped (`continue`).

### Custom Threat Handling

- Custom threats set `maestroLayer` from `CustomThreatDefinition.maestroLayer` (ThreatModelCanvas ~line 325).
- As long as `maestroLayer` is set, custom threats are included and can map to AISVS requirements.
- If `maestroLayer` is ever missing, custom threats would be excluded.

### Verdict

- Custom threats are included when `maestroLayer` is set.
- There is no explicit filtering that excludes custom threats.
- **Risk:** Any custom threat with undefined `maestroLayer` would be skipped.

---

## 4. mitigationCatalog.ts

### Behavior

- **Lines 17–52:** `buildNodeMitigationCatalog` filters threats by `affectedNodeIds`, then groups mitigations by `threat.methodology`.
- Custom threats have `methodology: "custom"` and are treated like any other.
- **Lines 54–85:** `isThreatMitigated` and `filterMitigatedThreats` work on any threat with `mitigations`; they match by string comparison.

### Verdict

- No special handling for custom threats.
- Mitigation UI and filtering work for custom threats as for built-in ones.

---

## 5. dataIntegration.ts

### Behavior

- **Lines 4–24:** `enrichThreatsWithSecurityData` matches threat names against `threatsData` (built-in catalog).
- If a match is found, `mitigationIds` and `mitigations` from the catalog are merged into the threat.
- Custom threat names are user-defined and almost never match `threatsData`.

### Verdict

- Custom threats are not enriched from the built-in catalog; they already carry user-defined mitigations.
- This is expected behavior, not a bug.

---

## 6. ThreatResultsPanel.tsx

### Behavior

- **Lines 116–159:** `filteredAndSorted` operates on `result.threats` (all threats).
- **Lines 121–123:** Tabs filter by `methodology`:
  - "MAESTRO": `t.methodology === "MAESTRO"`
  - "Other": `t.methodology !== "MAESTRO"` → includes `"custom"`.
- **Lines 356–429:** Each threat is rendered with severity, description, mitigations, etc.

### Verdict

- No filtering that excludes custom threats.
- Custom threats appear under "Other".
- Severity, inherited, and maestro layer badges work for custom threats.

---

## 7. inheritedThreats.ts

### Behavior

- **Lines 20–87:** `runInheritedThreatPropagation` takes `directThreats` (built-in + custom) and propagates along edges.
- Propagation key uses `threat.id`; custom threats use IDs like `custom-${ct.id}-${node.id}`.
- **Lines 56–77:** `targetNode` is looked up; if it has `data`, an inherited threat is created.
- `nodeProfile` builds profiles for all non–trust-boundary nodes, including custom.

### Verdict

- Custom threats propagate in the same way as built-in threats.
- No category-based filtering; propagation is topology-based.

---

## 8. exportMarkdown.ts

### Behavior

- **Lines 17–191:** `generateMarkdownReport` uses `result.threats` and `result.summary`.
- **Lines 140–162:** All threats are sorted by severity and written; no filtering.
- Component inventory and data flow inventory iterate over `nodes` and `edges` without excluding custom items.

### Verdict

- Custom threats and custom components are exported.
- No gaps in markdown export.

---

## 9. exportCSV.ts

### Behavior

- **Lines 14–23:** `result.threats.map(...)` exports every threat.
- Columns include Severity, Name, Description, Methodology, MAESTRO Layer, Inherited, Affected Components, Mitigations.
- Custom threats have `methodology: "custom"` and `maestroLayer` when set.

### Verdict

- All threats, including custom, are exported.
- No filtering.

---

## 10. exportSARIF.ts

### Behavior

- **Lines 18–37:** Rules and results are built from `result.threats.map(...)`.
- Each threat becomes a rule and a result.
- Custom threats use IDs like `custom-${ct.id}-${node.id}`.

### Verdict

- All threats, including custom, are exported.
- No filtering.

---

## Cross-Cutting Gaps

### GAP 1: Attack Paths — Custom Components Not Entry Points or Targets

**File:** `src/components/threat-modeler/engine/attackPaths.ts`  
**Lines 30–47:**

```typescript
const entryPoints = nodes.filter(
  (n) =>
    n.data?.category === "actor" ||
    n.data?.category === "external" ||
    n.data?.trustLevel === "untrusted",
);
const highValueTargets = nodes.filter((n) => {
  if (
    n.data?.category === "kc4" ||
    n.data?.category === "kc6" ||
    n.data?.category === "datastore"
  )
    return true;
  const profile = profiles?.get(n.id);
  if (profile?.handlesCredentials || profile?.handlesRegulatedData) return true;
  if (profile?.isExecutionCapable) return true;
  return false;
});
```

- Entry points: `actor`, `external`, or `trustLevel === "untrusted"`.
- Targets: hardcoded categories (`kc4`, `kc6`, `datastore`) or profile flags from `toolAccessMode`/`dataSensitivity`.
- Custom components always have `category: "custom"` and never appear in the category checks.
- Custom components do not get `toolAccessMode` or `dataSensitivity` set (see GAP 2).
- Result: Custom components can appear in the middle of paths but are never entry points or high-value targets.

**Impact:** Custom “External API” or “Credential Store” components are not treated as path endpoints.

**Suggestion:** Add `category === "custom"` with `trustLevel === "untrusted"` to entry points, and allow custom components to become high-value targets based on trust level and/or sensitivity metadata.

---

### GAP 2: NodeEditorDialog — Tool/Prompt/Sensitivity Hidden for Custom

**File:** `src/components/threat-modeler/NodeEditorDialog.tsx`  
**Lines 91–94:**

```typescript
const showToolFields = nodeCategory === "kc5";
const showPromptFields = nodeCategory === "kc3";
const showSensitivityField = nodeCategory === "kc4" || nodeCategory === "kc5" || nodeCategory === "datastore";
```

- `nodeCategory === "custom"` never matches.
- Tool access mode, tool risk tier, prompt type, and data sensitivity are never shown or editable for custom components.

**Impact:** Custom components cannot be configured with tool/prompt/sensitivity metadata, so they cannot influence risk profiles and attack path selection.

**Suggestion:** Include `"custom"` in the conditions that show these fields (e.g. `showToolFields`, `showSensitivityField`) when relevant for custom components.

---

### GAP 3: Custom Component Definition Changes Not Propagated to Existing Nodes

- When a custom component is edited (e.g. threats added/removed), existing canvas nodes retain their original `customThreatIds`.
- New nodes get the updated `customThreatIds`; existing ones do not.
- Deleted custom components leave nodes with `customThreatIds` that no longer match any `customComponent`.

**Suggestion:** On component definition change, either:
  - Refresh `customThreatIds` on all nodes that reference that component (by `componentId` or similar), or
  - Document that users must replace nodes to pick up definition changes.

---

### GAP 4: What-If Mode Omits Custom Threats

**File:** `ThreatModelCanvas.tsx`  
**Lines 539–544:**

```typescript
const simResult = runThreatAnalysis(filteredNodes, filteredEdges, methodology);
```

- The What-If simulation calls `runThreatAnalysis` without the 4th argument (`customComponentThreats`).
- Custom threats are never collected or passed in the What-If path.

**Impact:** What-If results undercount threats when the model has custom components with custom threats.

**Suggestion:** Collect custom threats for the What-If scenario (from remaining custom nodes) and pass them into `runThreatAnalysis`.

---

## Data Flow Diagram

```
User adds custom component from palette
    → onDrop / handleAddComponentFromPalette
    → node.data: { isCustom: true, customThreatIds: [...], category: "custom", ... }

User runs analysis (doAnalysis)
    → Collect customThreats from nodes (isCustom + customThreatIds) × customComponents
    → runThreatAnalysis(nodes, edges, methodology, customThreats)
        → threatEngine: maestroRules + connectionRules + topologyRules + customThreats
        → runInheritedThreatPropagation (includes custom)
        → deduplicate
    → enrichThreatsWithSecurityData (no match for custom names)
    → buildNodeProfiles (all nodes including custom)
    → calculateModelRisk, findAttackPaths, runAISVSMapping
    → filterMitigatedThreats (includes custom)
    → Badges → nodes/edges
    → ThreatResultsPanel (filteredAnalysisResult)
    → Exports: Markdown, CSV, SARIF (all use result.threats)
```

---

## Recommendations

1. **Attack paths:** Extend entry points and high-value targets to support custom components (e.g. via trust level and metadata).
2. **Node editor:** Show tool access, risk tier, prompt type, and data sensitivity for custom components when relevant.
3. **What-If mode:** Pass custom threats into `runThreatAnalysis` when computing the What-If result.
4. **Component definition sync:** Add a way to refresh existing nodes when a custom component definition changes.
5. **AISVS mapping:** Ensure custom threats always have a valid `maestroLayer` (e.g. enforce in `CustomComponentDialog` or default in the engine).
