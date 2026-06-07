const { readFileSync, writeFileSync } = require('fs')
const { exit } = require('process')

const filePath = './index.js'

try {
  let content = readFileSync(filePath, 'utf8')

  content = content.replace(
    /^import \$protobuf from ["']protobufjs\/minimal\.js["'];\s*/m,
    '"use strict";\nconst $protobuf = require("protobufjs/minimal");\n'
  )

  content = content.replace(
    /^import \* as (\$protobuf) from ["']protobufjs\/minimal(?:\.js)?["'];\s*/m,
    '"use strict";\nconst $1 = require("protobufjs/minimal");\n'
  )

  content = content.replace(
    /var \$protobuf = require\(["']protobufjs\/minimal\.js["']\);/g,
    'var $protobuf = require("protobufjs/minimal");'
  )

  content = content.replace(
    /const \$protobuf = require\(["']protobufjs\/minimal\.js["']\);/g,
    'const $protobuf = require("protobufjs/minimal");'
  )

  content = content.replace(
    /export const proto = \$root\.proto = \(\(\) => \{/,
    'const proto = $root.proto = (() => {'
  )

  content = content.replace(
    /export \{ \$root as default \};\s*$/m,
    'module.exports = $root;\n'
  )

  if (!content.includes('module.exports = $root')) {
    content += '\nmodule.exports = $root;\n'
  }

  writeFileSync(filePath, content, 'utf8')
  console.log('✅ Fixed WAProto imports for Elaina CommonJS')
} catch (error) {
  console.error(`❌ Error fixing WAProto imports: ${error.message}`)
  exit(1)
}
