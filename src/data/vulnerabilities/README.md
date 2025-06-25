# Vulnerability Database

This folder contains vulnerability reports in markdown format with YAML frontmatter.

## File Structure

Each vulnerability should be saved as `AVD-YYYY-XXX.md` where:
- `YYYY` is the year of disclosure
- `XXX` is the sequential number (001, 002, etc.)

## File Format

Each vulnerability file must have YAML frontmatter followed by markdown content:

```markdown
---
id: "AVD-2024-001"
title: "Vulnerability Title"
description: "Brief description"
severity: "critical" | "high" | "medium" | "low"
cvss_score: 7.5
cve_id: null | "CVE-YYYY-NNNN"
disclosure_date: "YYYY-MM-DD"
discovered_by: "Researcher Name"
affected_systems:
  - "System 1"
  - "System 2"
vulnerability_type: "prompt_injection" | "rag_poisoning" | "supply_chain_attack" | etc.
attack_vector: "vector_description"
impact:
  confidentiality: true | false
  integrity: true | false
  availability: true | false
technical_details:
  attack_method: "Description of how the attack works"
  exploitation_complexity: "low" | "medium" | "high"
  user_interaction: "required" | "none"
  scope: "unchanged" | "changed"
threat_mapping:
  - "t1"
  - "t6"
mitigation_mapping:
  - "m1"
  - "m4"
proof_of_concept:
  available: true | false
  description: "PoC description"
remediation:
  vendor_response: "Vendor response"
  workarounds:
    - "Workaround 1"
    - "Workaround 2"
  patch_status: "fully_patched" | "partially_fixed" | "mitigated" | "under_investigation" | "not_patched"
references:
  - title: "Reference Title"
    url: "https://example.com"
    type: "blog_post" | "research_paper" | "conference_talk" | "news_article" | "advisory"
tags:
  - "tag1"
  - "tag2"
status: "disclosed" | "draft" | "withdrawn"
last_updated: "YYYY-MM-DD"
---

# Vulnerability Title

## Overview

Detailed description and analysis of the vulnerability...

## Technical Details

Technical explanation...

## Impact

Impact analysis...

## Mitigation

Mitigation strategies...
```

## Adding New Vulnerabilities

1. Create a new `.md` file with the next sequential AVD ID
2. Fill in all required frontmatter fields
3. Write detailed markdown content
4. The website will automatically pick up the new file on next build

## Dynamic Loading

The website uses Vite's `import.meta.glob()` to dynamically load all markdown files at build time. The vulnerabilities are:

- Automatically parsed from frontmatter
- Sorted by disclosure date (newest first)
- Made available to the React components
- Searchable by content, tags, and metadata 