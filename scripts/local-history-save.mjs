#!/usr/bin/env node
/**
 * Delegates to backup-321.mjs (slot1/slot2/slot3 rotation).
 * Use: npm run local backup
 */
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const script = path.join(__dirname, 'backup-321.mjs')
const r = spawnSync(process.execPath, [script], { stdio: 'inherit', cwd: path.resolve(__dirname, '..') })
process.exit(r.status ?? 1)
