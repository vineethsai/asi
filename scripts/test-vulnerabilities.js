#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple frontmatter parser (same as in vulnerabilityLoader.ts)
function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') {
    return { data: {}, content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { data: {}, content };
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const markdownContent = lines.slice(endIndex + 1).join('\n');

  // Parse YAML-like frontmatter
  const data = {};
  const stack = [data];
  let currentObj = data;
  let currentKey = '';
  let indent = 0;

  for (let i = 0; i < frontmatterLines.length; i++) {
    const line = frontmatterLines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    // Calculate indentation
    const lineIndent = line.length - line.trimStart().length;

    // Handle array items
    if (trimmedLine.startsWith('- ')) {
      const item = trimmedLine.substring(2).trim();
      let parsedItem = item;

      // Handle nested objects in arrays
      if (item.includes(':')) {
        const colonIndex = item.indexOf(':');
        const key = item.substring(0, colonIndex).trim();
        const value = item.substring(colonIndex + 1).trim();
        parsedItem = { [key]: parseValue(value) };
      } else {
        parsedItem = parseValue(item);
      }

      if (Array.isArray(currentObj[currentKey])) {
        currentObj[currentKey].push(parsedItem);
      } else {
        currentObj[currentKey] = [parsedItem];
      }
      continue;
    }

    // Handle key-value pairs
    if (trimmedLine.includes(':')) {
      const colonIndex = trimmedLine.indexOf(':');
      const key = trimmedLine.substring(0, colonIndex).trim();
      const value = trimmedLine.substring(colonIndex + 1).trim();

      // Adjust object context based on indentation
      while (stack.length > 1 && lineIndent <= indent) {
        stack.pop();
        currentObj = stack[stack.length - 1];
        indent -= 2;
      }

      if (value === '') {
        // This is likely the start of a nested object or array
        currentKey = key;
        
        // Look ahead to see if next line is an array or object
        const nextLine = i + 1 < frontmatterLines.length ? frontmatterLines[i + 1] : '';
        const nextTrimmed = nextLine.trim();
        
        if (nextTrimmed.startsWith('- ')) {
          currentObj[key] = [];
        } else {
          currentObj[key] = {};
          stack.push(currentObj[key]);
          currentObj = currentObj[key];
          indent = lineIndent;
        }
      } else {
        // Simple key-value pair
        currentObj[key] = parseValue(value);
        currentKey = key;
      }
    }
  }

  return { data, content: markdownContent };
}

// Helper function to parse values
function parseValue(value) {
  const trimmed = value.trim();
  
  // Remove quotes
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  
  // Parse booleans
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  
  // Parse numbers
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }
  
  return trimmed;
}

function testVulnerabilities() {
  console.log('🔍 Testing Vulnerability Files');
  console.log('================================\n');

  const vulnDir = path.join(__dirname, '..', 'src', 'data', 'vulnerabilities');
  
  if (!fs.existsSync(vulnDir)) {
    console.error('❌ Vulnerability directory not found:', vulnDir);
    process.exit(1);
  }

  const files = fs.readdirSync(vulnDir)
    .filter(file => file.endsWith('.md') && file !== 'README.md')
    .sort();

  if (files.length === 0) {
    console.log('⚠️  No vulnerability files found');
    return;
  }

  console.log(`Found ${files.length} vulnerability files:\n`);

  const requiredFields = [
    'id', 'title', 'description', 'severity', 
    'cvss_score', 'disclosure_date', 'discovered_by'
  ];

  let validCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(vulnDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`📄 Testing: ${file}`);
    
    try {
      const { data, content: markdownContent } = parseFrontmatter(content);
      
      // Check required fields
      const missingFields = requiredFields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
        errorCount++;
      } else {
        console.log(`   ✅ Valid frontmatter`);
        
        // Show parsed data summary
        console.log(`   📊 ID: ${data.id}, Severity: ${data.severity}, CVSS: ${data.cvss_score}`);
        console.log(`   🔍 Discoverer: ${data.discovered_by}`);
        console.log(`   📅 Disclosed: ${data.disclosure_date}`);
        
        if (data.threat_mapping && data.threat_mapping.length > 0) {
          console.log(`   🎯 Threats: ${data.threat_mapping.join(', ')}`);
        }
        
        if (data.mitigation_mapping && data.mitigation_mapping.length > 0) {
          console.log(`   🛡️  Mitigations: ${data.mitigation_mapping.join(', ')}`);
        }
        
        if (data.tags && data.tags.length > 0) {
          console.log(`   🏷️  Tags: ${data.tags.join(', ')}`);
        }
        
        validCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Parse error: ${error.message}`);
      errorCount++;
    }
    
    console.log('');
  }

  console.log('📊 Summary');
  console.log('==========');
  console.log(`✅ Valid files: ${validCount}`);
  console.log(`❌ Invalid files: ${errorCount}`);
  console.log(`📁 Total files: ${files.length}`);

  if (errorCount > 0) {
    console.log('\n❌ Some files have errors. Please fix them before committing.');
    process.exit(1);
  } else {
    console.log('\n🎉 All vulnerability files are valid!');
  }
}

// Run the test
testVulnerabilities(); 