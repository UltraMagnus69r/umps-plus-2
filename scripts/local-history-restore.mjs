#!/usr/bin/env node
/**
 * Local file history — restore from snapshot 1, 2, or 3. Y/N confirmation required.
 * Skips .git and .local-history on restore.
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const historyRoot = path.join(projectRoot, '.local-history')

const slot = process.argv[2]
if (!slot || !['1', '2', '3'].includes(slot)) {
  console.error('Usage: node scripts/local-history-restore.mjs <1|2|3>')
  process.exit(1)
}

const slotDir = { '1': 'slot1', '2': 'slot2', '3': 'slot3' }[slot]
const source = path.join(historyRoot, slotDir)
if (!fs.existsSync(source)) {
  console.error('No snapshot found for slot', slot)
  process.exit(1)
}

const SKIP = new Set(['.git', '.local-history', '.history-meta.json'])

function rmRecursive(dir) {
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 })
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    if (SKIP.has(path.basename(src))) return
    fs.mkdirSync(dest, { recursive: true })
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name))
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
  }
}

function restore() {
  for (const name of fs.readdirSync(source)) {
    if (SKIP.has(name)) continue
    const srcPath = path.join(source, name)
    const destPath = path.join(projectRoot, name)
    if (fs.statSync(srcPath).isDirectory()) {
      if (fs.existsSync(destPath)) rmRecursive(destPath)
      copyRecursive(srcPath, destPath)
    } else {
      copyRecursive(srcPath, destPath)
    }
  }
  console.log('Restored from snapshot', slot)
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('Overwrite current working directory with snapshot ' + slot + '? (Y/N): ', (answer) => {
  rl.close()
  if (answer.trim().toUpperCase() === 'Y') {
    restore()
  } else {
    console.log('Restore cancelled.')
  }
})
