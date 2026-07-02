const fs = require('fs')
const path = require('path')

const localesDir = 'D:/- 酒馆/反向代理/new-api/web/default/src/i18n/locales'
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'))

// Keys to completely remove from the translation object
const removeKeys = new Set([
  'New API Project Repository:',
  'https://github.com/QuantumNous/new-api',
  'NewAPI',
  'QuantumNous',
  'footer.columns.related.links.newApiKeyTool',
])

// Text replacements: [from, to] — applied to both keys and values
const textReplacements = [
  ['Apps using the most tokens through new-api', 'Apps using the most tokens through this platform'],
  ['e.g. New API Console', 'e.g. Dashboard Console'],
  ['Format: AccessKey|SecretKey (or just ApiKey if upstream is New API)', 'Format: AccessKey|SecretKey (or just ApiKey if upstream is the same platform)'],
  ['If connecting to upstream One API and New API relay projects, use OpenAI type instead unless you know what you are doing', 'If connecting to upstream relay projects, use OpenAI type instead unless you know what you are doing'],
  ['Warning: Base URL should not end in /v1. New API will handle it automatically. This may cause request failures.', 'Warning: Base URL should not end in /v1. The platform will handle it automatically. This may cause request failures.'],
  ['Welcome to our New API...', 'Welcome to the dashboard...'],
  ['Custom API base URL. For official channels, New API has built-in addresses. Only fill this for third-party proxy sites or special endpoints. Do not add /v1 or trailing slash.', 'Custom API base URL. For official channels, the platform has built-in addresses. Only fill this for third-party proxy sites or special endpoints. Do not add /v1 or trailing slash.'],
  ['when a user enters any amount, new-api runs the checkout', 'when a user enters any amount, this platform runs the checkout'],
  ['for every Pancake product new-api creates from this admin', 'for every Pancake product this platform creates from this admin'],
]

for (const file of files) {
  const filePath = path.join(localesDir, file)
  const raw = fs.readFileSync(filePath, 'utf8')
  const obj = JSON.parse(raw)
  const translation = obj.translation || obj

  let removedCount = 0
  let renamedCount = 0

  // Phase 1: Remove brand-only entries
  for (const key of removeKeys) {
    if (key in translation) {
      delete translation[key]
      removedCount++
    }
  }

  // Phase 2: Collect key renames
  const renames = []
  for (const key of Object.keys(translation)) {
    for (const [from, to] of textReplacements) {
      if (key.includes(from)) {
        const newKey = key.replace(from, to)
        if (newKey !== key) {
          renames.push([key, newKey])
        }
        break
      }
    }
  }

  // Apply renames
  for (const [oldKey, newKey] of renames) {
    if (oldKey !== newKey) {
      translation[newKey] = translation[oldKey]
      delete translation[oldKey]
      renamedCount++
    }
  }

  // Phase 3: Apply value replacements
  for (const key of Object.keys(translation)) {
    if (typeof translation[key] === 'string') {
      for (const [from, to] of textReplacements) {
        if (translation[key].includes(from)) {
          translation[key] = translation[key].replace(from, to)
        }
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8')
  console.log(`  Updated: ${file} (${removedCount} removed, ${renamedCount} renamed)`)
}

console.log('Done.')
