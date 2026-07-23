#!/usr/bin/env node
/**
 * 3-tier rotating local backup (deterministic overwrite).
 * Order: slot1 ← slot2, slot2 ← slot3, slot3 ← project (no Git, no snapshots, no compression).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const historyRoot = path.join(projectRoot, '.local-history')

const slot1 = path.join(historyRoot, 'slot1')
const slot2 = path.join(historyRoot, 'slot2')
const slot3 = path.join(historyRoot, 'slot3')

const EXCLUDE = new Set([
  '.local-history',
  '.git',
  'node_modules',
  'dist',
  'build',
  '.vite',
  '.cache',
])

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function emptyDir(dirPath) {
  ensureDir(dirPath)
  for (const entry of fs.readdirSync(dirPath)) {
    fs.rmSync(path.join(dirPath, entry), { recursive: true, force: true })
  }
}

function dirEntryCount(dirPath) {
  if (!fs.existsSync(dirPath)) return 0
  return fs.readdirSync(dirPath).length
}

/** Delete dest, copy all entries from src into dest (recursive). Src may be empty. */
function copySlotToSlot(srcDir, destDir) {
  ensureDir(srcDir)
  emptyDir(destDir)
  for (const entry of fs.readdirSync(srcDir)) {
    fs.cpSync(path.join(srcDir, entry), path.join(destDir, entry), {
      recursive: true,
      force: true,
    })
  }
}

function copyProjectToSlot3() {
  emptyDir(slot3)
  for (const entry of fs.readdirSync(projectRoot)) {
    if (EXCLUDE.has(entry)) continue
    fs.cpSync(path.join(projectRoot, entry), path.join(slot3, entry), {
      recursive: true,
      force: true,
    })
  }
}

// --- Phase 1: structure ---
ensureDir(historyRoot)
ensureDir(slot1)
ensureDir(slot2)
ensureDir(slot3)

const log = []

// STEP 1: slot1 ← slot2
try {
  const srcN = dirEntryCount(slot2)
  copySlotToSlot(slot2, slot1)
  log.push({ step: 'Slot1 ← Slot2', ok: true, note: srcN === 0 ? 'source empty; slot1 cleared' : `copied from ${srcN} top-level entries` })
} catch (e) {
  log.push({ step: 'Slot1 ← Slot2', ok: false, error: String(e.message || e) })
}

// STEP 2: slot2 ← slot3
try {
  const srcN = dirEntryCount(slot3)
  copySlotToSlot(slot3, slot2)
  log.push({ step: 'Slot2 ← Slot3', ok: true, note: srcN === 0 ? 'source empty; slot2 cleared' : `copied from ${srcN} top-level entries` })
} catch (e) {
  log.push({ step: 'Slot2 ← Slot3', ok: false, error: String(e.message || e) })
}

// STEP 3: slot3 ← project
try {
  copyProjectToSlot3()
  const n = dirEntryCount(slot3)
  log.push({ step: 'Slot3 ← Project', ok: true, note: `${n} top-level entries in slot3` })
} catch (e) {
  log.push({ step: 'Slot3 ← Project', ok: false, error: String(e.message || e) })
}

console.log(JSON.stringify({ historyRoot, slot1, slot2, slot3, log }, null, 2))
