const fs = require('fs')
const path = require('path')

const srcDir = process.argv[2] || '.'

// Remove these specific lines from copyright headers
// The AGPL license text stays, only brand attribution lines are removed
const removePatterns = [
  'Copyright (C) 2023-2026 QuantumNous',
  'For commercial licensing, please contact support@quantumnous.com',
]

// Brand string replacements
const brandReplacements = [
  // Request headers
  { from: "'New-Api-User'", to: "'X-User-Id'" },
  { from: '"New-Api-User"', to: '"X-User-Id"' },

  // localStorage keys
  { from: "newapi:default:cache-version", to: "dashboard:cache-version" },

  // API paths
  { from: "/llm-metadata/api/newapi/ratio_config-v1-base.json", to: "/llm-metadata/api/ratio_config-v1-base.json" },

  // Channel type config
  { from: "icon: 'newapi'", to: "icon: 'default'" },
  { from: "'NewAPI', // Advanced Custom", to: "'Advanced Custom'" },

  // Channel constants
  { from: "Format: AccessKey|SecretKey (or just ApiKey if upstream is New API)", to: "Format: AccessKey|SecretKey (or just ApiKey if upstream is the same platform)" },
  { from: "If connecting to upstream One API or New API relay projects...", to: "If connecting to upstream relay projects..." },

  // Channel mutate drawer
  { from: "Warning: Base URL should not end with /v1. New API will handle it automatically...", to: "Warning: Base URL should not end with /v1. The platform will handle it automatically..." },
  { from: "Custom API base URL. For official channels, New API has built-in addresses...", to: "Custom API base URL. For official channels, the platform has built-in addresses..." },

  // Keys data table
  { from: "_type: 'newapi_channel_conn',", to: "_type: 'channel_conn'," },

  // Chat links
  { from: "id: 'new-api',", to: "id: 'default'," },
  { from: "platform: 'new-api',", to: "platform: 'default'," },
  { from: "'fluent-new-api-container'", to: "'fluent-container'" },

  // Pricing
  { from: "apiKeyEnv: 'NEW_API_KEY'", to: "apiKeyEnv: 'API_KEY'" },

  // System info panel
  { from: "NODE_NAME=new-api-master-1", to: "NODE_NAME=master-1" },

  // Keys comment
  { from: "// Create a new API key", to: "// Create an API key" },

  // Subscriptions types comment
  { from: "// surfaced for future flows (refund / cancel from new-api's own UI).", to: "// surfaced for future flows (refund / cancel)." },
  { from: "// future flows (refund / cancel from new-api's own UI) can use them", to: "// future flows can use them" },
]

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  // Remove copyright header lines containing brand references
  // Also remove empty lines left behind by their removal
  for (const pattern of removePatterns) {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    if (regex.test(content)) {
      // Remove the line and any immediately following empty line
      content = content.split('\n').filter((line, idx, arr) => {
        if (line.includes(pattern)) {
          // Remove this line
          return false
        }
        return true
      }).join('\n')
      modified = true
    }
  }

  // Apply brand replacements
  for (const replacement of brandReplacements) {
    const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    if (regex.test(content)) {
      content = content.replace(regex, replacement.to)
      modified = true
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`  Updated: ${path.relative(srcDir, filePath)}`)
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(fullPath)
    } else if (entry.isFile() && /\.(ts|tsx|mjs)$/.test(entry.name)) {
      processFile(fullPath)
    }
  }
}

console.log('Processing source files...')
walkDir(srcDir)
console.log('Done.')
